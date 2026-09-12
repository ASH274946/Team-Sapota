import OpenAI from 'openai';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { preprocessImageForOcr, PreprocessedImage } from './image-preprocessor';
import { parseAnswerSheetText, StructuredAnswerSheetResult } from './answer-sheet-parser';
import { isImageDescriptionNoise, cleanExtractedText } from '../document-extractor.service';
import { GeminiProvider } from '../ai/providers/gemini.provider';

export type DocumentPurpose = 'handwritten_notes' | 'answer_sheet' | 'syllabus' | 'general';

export interface OcrExtractionOptions {
  purpose?: DocumentPurpose;
  filename?: string;
  mimeType?: string;
  onProgress?: (progress: { page: number; total: number; filename: string }) => void;
  bypassCache?: boolean;
}

export interface OcrExtractionResult {
  text: string;
  hash: string;
  mimeType: string;
  isCached: boolean;
  purpose: DocumentPurpose;
  confidenceScore: number; // 0 - 100
  needsHumanReview: boolean;
  unreadableRegionsCount: number;
  isLikelyPhonePhoto: boolean;
  structuredAnswerSheet?: StructuredAnswerSheetResult;
  processingTimeMs: number;
  modelUsed: string;
}

// In-memory cache for ultra-fast instant repeated lookups (< 5ms)
const inMemoryOcrCache = new Map<string, OcrExtractionResult>();
const MAX_IN_MEMORY_CACHE_ENTRIES = 100;

export class HandwritingOcrService {
  private static geminiProvider = new GeminiProvider();

  /**
   * Generates tailored vision system prompts based on the document purpose.
   */
  private static buildVisionPrompt(purpose: DocumentPurpose, preprocessed: PreprocessedImage): string {
    const commonInstructions = [
      'You are an expert, high-precision OCR and document transcription engine specialized in real-world handwritten documents and mobile phone photos.',
      'Auto-correct any perspective skew, tilt, rotation (90°/180°/270°), uneven lighting gradients, cast shadows, and reflections.',
      'Transcribe in the natural reading order (top-to-bottom, left-to-right).',
      'Do NOT describe the image, photo, camera, device, background, table, fingers, margins, lighting, or screen UI.',
      'Do NOT output conversational intros or disclaimers like "Here is the transcription..." or "The image contains...".',
      'ZERO-HALLUCINATION POLICY: Never invent, guess, summarize, or substitute standard textbook answers for illegible text. If any handwriting is genuinely illegible, smudged, or cut off, transcribe it explicitly as [unreadable handwriting].',
      'If the student or writer crossed out or struck through text, do not transcribe the struck-through text (or indicate it as [crossed out]).',
      'Transcribe mathematical equations, symbols, fractions, superscripts, subscripts, and formulas accurately (use standard notation or LaTeX where appropriate).',
      'If there are handwritten sketches, graphs, or labeled diagrams, transcribe a concise semantic tag on its own line: [Diagram: Description with visible labels].',
    ];

    const enhancement = preprocessed.enhancementPromptHints && preprocessed.enhancementPromptHints.length > 0
      ? `\n${preprocessed.enhancementPromptHints.join('\n')}`
      : '';

    if (purpose === 'answer_sheet') {
      return [
        ...commonInstructions,
        '\n--- DOCUMENT TYPE: STUDENT HANDWRITTEN ANSWER SHEET ---',
        'Preserve all Question numbers (e.g. Q1, Question 2, 3(a), Part B Q4, Ans 1).',
        'Preserve step-by-step mathematical derivations, working steps, bullet points, and final answer statements.',
        'Keep distinct questions separated by clear spacing.',
        'Output ONLY the transcribed student answer sheet content.',
        enhancement,
      ].filter(Boolean).join('\n');
    }

    if (purpose === 'handwritten_notes') {
      return [
        ...commonInstructions,
        '\n--- DOCUMENT TYPE: HANDWRITTEN LECTURE NOTES / STUDY MATERIAL ---',
        'Preserve multi-column layouts, headings, sub-headings, indented bullet points, numbered lists, and marginal notes.',
        'Output ONLY the transcribed study notes text.',
      ].join('\n');
    }

    if (purpose === 'syllabus') {
      return [
        ...commonInstructions,
        '\n--- DOCUMENT TYPE: SYLLABUS / CURRICULUM ---',
        'Preserve all units, modules, chapters, topics, course outcomes, tutorials, and revision entries.',
        'Output ONLY the syllabus content.',
      ].join('\n');
    }

    return [
      ...commonInstructions,
      '\n--- DOCUMENT TYPE: GENERAL DOCUMENT (PRINTED / HANDWRITTEN / MIXED) ---',
      'Transcribe all visible printed and handwritten text verbatim with structural formatting.',
    ].join('\n');
  }

  /**
   * Primary OCR Execution with multi-model fallback (Gemini 2.5 Flash -> NVIDIA NIM -> OpenAI GPT-4o).
   */
  static async extractFromImageBuffer(
    imageBuffer: Buffer,
    options: OcrExtractionOptions = {}
  ): Promise<OcrExtractionResult> {
    const startTime = Date.now();
    const purpose = options.purpose || 'general';
    const preprocessed = preprocessImageForOcr(imageBuffer, options.filename, options.mimeType);

    // 1. Check in-memory cache
    if (!options.bypassCache && inMemoryOcrCache.has(preprocessed.hash)) {
      const cached = inMemoryOcrCache.get(preprocessed.hash)!;
      logger.debug({ hash: preprocessed.hash }, '[HandwritingOcrService] Cache hit (in-memory)');
      return {
        ...cached,
        isCached: true,
        processingTimeMs: Date.now() - startTime,
      };
    }

    const systemPrompt = this.buildVisionPrompt(purpose, preprocessed);
    let rawTranscription = '';
    let modelUsed = '';
    let lastError: any = null;

    // ── TIER 1: Google Gemini 2.5 Flash Vision ──
    if (this.geminiProvider.isConfigured()) {
      try {
        logger.info({ model: 'gemini-2.5-flash', filename: options.filename }, '[HandwritingOcrService] Attempting Tier 1 (Gemini 2.5 Flash Vision)...');
        const geminiResult = await this.geminiProvider.generate(
          systemPrompt + '\n\nTranscribe all text from this handwritten/printed document image verbatim:',
          {
            media: [{ type: 'image_url', url: preprocessed.dataUrl }],
            temperature: 0.0,
            maxTokens: 4096,
          }
        );

        if (geminiResult && geminiResult.trim().length > 0) {
          rawTranscription = geminiResult.trim();
          modelUsed = 'gemini-2.5-flash';
        }
      } catch (geminiErr: any) {
        lastError = geminiErr;
        logger.warn({ error: geminiErr.message }, '[HandwritingOcrService] Tier 1 (Gemini) failed, falling back to Tier 2...');
      }
    }

    // ── TIER 2: NVIDIA NIM Vision (Llama 3.2 11B / 90B) ──
    if (!rawTranscription && env.NVIDIA_API_KEY && env.NVIDIA_API_KEY.trim().length > 5) {
      try {
        logger.info({ provider: 'nvidia', filename: options.filename }, '[HandwritingOcrService] Attempting Tier 2 (NVIDIA NIM Vision)...');
        const nvidiaClient = new OpenAI({
          apiKey: env.NVIDIA_API_KEY,
          baseURL: 'https://integrate.api.nvidia.com/v1',
          timeout: 25000,
        });

        const models = ['meta/llama-3.2-11b-vision-instruct', 'meta/llama-3.2-90b-vision-instruct'];
        for (const model of models) {
          try {
            const resp = await nvidiaClient.chat.completions.create({
              model,
              temperature: 0.0,
              max_tokens: 3072,
              messages: [
                { role: 'system', content: systemPrompt },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Transcribe the handwritten and printed text from this document image:' },
                    { type: 'image_url', image_url: { url: preprocessed.dataUrl } },
                  ],
                },
              ],
            });

            const content = resp.choices[0]?.message?.content?.trim();
            if (content && content.length > 0) {
              rawTranscription = content;
              modelUsed = `nvidia/${model}`;
              break;
            }
          } catch (nvModelErr) {
            lastError = nvModelErr;
          }
        }
      } catch (nvErr: any) {
        lastError = nvErr;
        logger.warn({ error: nvErr.message }, '[HandwritingOcrService] Tier 2 (NVIDIA) failed, falling back to Tier 3...');
      }
    }

    // ── TIER 3: OpenAI GPT-4o / GPT-4o-mini Vision ──
    if (!rawTranscription && env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 5) {
      try {
        logger.info({ provider: 'openai', filename: options.filename }, '[HandwritingOcrService] Attempting Tier 3 (OpenAI Vision)...');
        const openaiClient = new OpenAI({
          apiKey: env.OPENAI_API_KEY,
          timeout: 25000,
        });

        const resp = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.0,
          max_tokens: 3072,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Transcribe the text from this document image verbatim:' },
                { type: 'image_url', image_url: { url: preprocessed.dataUrl } },
              ],
            },
          ],
        });

        const content = resp.choices[0]?.message?.content?.trim();
        if (content && content.length > 0) {
          rawTranscription = content;
          modelUsed = 'openai/gpt-4o-mini';
        }
      } catch (oaErr: any) {
        lastError = oaErr;
        logger.error({ error: oaErr.message }, '[HandwritingOcrService] Tier 3 (OpenAI) failed');
      }
    }

    if (!rawTranscription) {
      throw new Error(`Handwriting OCR failed across all vision providers: ${lastError?.message || 'No readable text extracted'}`);
    }

    // ── POST-PROCESSING & CLEANING ──
    const sanitizedText = this.sanitizeOcrOutput(rawTranscription, purpose);

    // Optional structured answer sheet parsing
    let structuredAnswerSheet: StructuredAnswerSheetResult | undefined;
    if (purpose === 'answer_sheet') {
      structuredAnswerSheet = parseAnswerSheetText(sanitizedText);
    }

    // Count unreadable segments
    const unreadableMatches = sanitizedText.match(/\[unreadable(?:\s+handwriting)?\]/gi) || [];
    const unreadableCount = unreadableMatches.length;

    // Calculate confidence score (0 - 100)
    let confidenceScore = 95;
    if (unreadableCount > 0) {
      confidenceScore = Math.max(30, confidenceScore - unreadableCount * 12);
    }
    if (sanitizedText.length < 20) {
      confidenceScore = Math.min(confidenceScore, 40);
    }
    if (preprocessed.isLikelyPhonePhoto && confidenceScore > 90) {
      confidenceScore = 92; // Realistic ceiling for phone photos
    }

    const needsHumanReview = confidenceScore < 70 || unreadableCount >= 3;
    const processingTimeMs = Date.now() - startTime;

    const result: OcrExtractionResult = {
      text: sanitizedText,
      hash: preprocessed.hash,
      mimeType: preprocessed.mimeType,
      isCached: false,
      purpose,
      confidenceScore,
      needsHumanReview,
      unreadableRegionsCount: unreadableCount,
      isLikelyPhonePhoto: preprocessed.isLikelyPhonePhoto,
      structuredAnswerSheet,
      processingTimeMs,
      modelUsed: modelUsed || 'vision-ai',
    };

    // Store in LRU cache
    if (inMemoryOcrCache.size >= MAX_IN_MEMORY_CACHE_ENTRIES) {
      const firstKey = inMemoryOcrCache.keys().next().value;
      if (firstKey) inMemoryOcrCache.delete(firstKey);
    }
    inMemoryOcrCache.set(preprocessed.hash, result);

    logger.info(
      {
        filename: options.filename,
        modelUsed,
        confidenceScore,
        unreadableCount,
        processingTimeMs,
        length: sanitizedText.length,
      },
      '[HandwritingOcrService] OCR extraction successful'
    );

    return result;
  }

  /**
   * Sanitizes OCR text by stripping model think blocks, code fences, and phone UI artifacts
   * while strictly preserving valid handwritten content, Q&A numbering, equations, and unreadable markers.
   */
  private static sanitizeOcrOutput(raw: string, purpose: DocumentPurpose): string {
    if (!raw) return '';

    let text = raw;

    // Remove <think> blocks from reasoning models
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // Strip wrapping markdown code blocks
    text = text.replace(/^```(?:markdown|text)?\r?\n([\s\S]*?)\r?\n```$/i, '$1');

    // Filter line-by-line for photo description noise and status bar icons
    const lines = text.split(/\r?\n/);
    const filteredLines = lines.filter((l) => {
      const trimmed = l.trim();
      if (!trimmed) return true; // keep blank line spacing
      if (isImageDescriptionNoise(trimmed)) return false;
      return true;
    });

    text = filteredLines.join('\n').trim();

    // If document is syllabus, run syllabus standardizer; otherwise preserve authentic format
    if (purpose === 'syllabus') {
      return cleanExtractedText(text);
    }

    return text;
  }

  /**
   * Batch extracts multiple image buffers progressively in parallel (concurrency: 3)
   * while strictly preserving page ordering.
   */
  static async extractBatchProgressive(
    images: Array<{ buffer: Buffer; filename?: string; mimeType?: string }>,
    options: OcrExtractionOptions = {}
  ): Promise<OcrExtractionResult[]> {
    if (!images || images.length === 0) return [];

    const results: OcrExtractionResult[] = new Array(images.length);
    const CONCURRENCY = 3;
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < images.length) {
        const idx = currentIndex++;
        const item = images[idx];
        try {
          const res = await this.extractFromImageBuffer(item.buffer, {
            ...options,
            filename: item.filename || `page-${idx + 1}`,
            mimeType: item.mimeType,
          });
          results[idx] = res;

          if (options.onProgress) {
            options.onProgress({
              page: idx + 1,
              total: images.length,
              filename: item.filename || `page-${idx + 1}`,
            });
          }
        } catch (err: any) {
          logger.error({ error: err.message, index: idx }, '[HandwritingOcrService] Batch item failed');
          results[idx] = {
            text: `[Error extracting text from ${item.filename || `Page ${idx + 1}`}: ${err.message}]`,
            hash: '',
            mimeType: item.mimeType || 'image/jpeg',
            isCached: false,
            purpose: options.purpose || 'general',
            confidenceScore: 0,
            needsHumanReview: true,
            unreadableRegionsCount: 1,
            isLikelyPhonePhoto: false,
            processingTimeMs: 0,
            modelUsed: 'none',
          };
        }
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, images.length) }, () => worker());
    await Promise.all(workers);

    return results;
  }
}
