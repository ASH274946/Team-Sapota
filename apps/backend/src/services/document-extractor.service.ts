import fs from 'fs';
import path from 'path';
import yauzl from 'yauzl';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { getR2Storage } from './storage/r2-storage';
import { HandwritingOcrService, DocumentPurpose } from './ocr/handwriting-ocr.service';

export interface FileExtractionResult {
  filename: string;
  fileType: string;
  status: 'success' | 'error';
  extractedText?: string;
  error?: string;
}

export interface BatchExtractionOutput {
  content: string;
  results: FileExtractionResult[];
}

/**
 * Unescapes common XML entities in Word XML.
 */
function unescapeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Extracts raw textual content from DOCX buffer by parsing word/document.xml inside the zip archive.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        return reject(new Error(`Failed to parse DOCX archive: ${err.message}`));
      }
      if (!zipfile) {
        return resolve('');
      }

      let documentXmlFound = false;

      zipfile.readEntry();

      zipfile.on('entry', (entry) => {
        if (entry.fileName === 'word/document.xml') {
          documentXmlFound = true;
          zipfile.openReadStream(entry, (streamErr, readStream) => {
            if (streamErr) {
              return reject(new Error(`Failed to read DOCX document XML: ${streamErr.message}`));
            }
            const chunks: Buffer[] = [];
            readStream.on('data', (chunk) => chunks.push(chunk));
            readStream.on('end', () => {
              try {
                const xml = Buffer.concat(chunks).toString('utf8');

                // Extract table rows and paragraphs
                // In DOCX:
                // <w:p> indicates a paragraph
                // <w:t> indicates a text run
                // <w:tab/> indicates a tab
                // <w:br/> indicates a line break
                // <w:tr> indicates a table row
                // <w:tc> indicates a table cell

                // Replace breaks and tabs with whitespace
                const normalizedXml = xml
                  .replace(/<w:br(?:\s[^>]*)?\/>/g, '\n')
                  .replace(/<w:cr(?:\s[^>]*)?\/>/g, '\n')
                  .replace(/<w:tab(?:\s[^>]*)?\/>/g, '\t');

                // Extract all paragraphs
                const paragraphMatches = normalizedXml.match(/<w:p(?:\s|>).*?<\/w:p>/gs) || [];
                const extractedLines: string[] = [];

                for (const p of paragraphMatches) {
                  // Collect all text nodes inside this paragraph
                  const textMatches = p.match(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/gs) || [];
                  const line = textMatches
                    .map((t) => t.replace(/<w:t(?:\s[^>]*)?>|<\/w:t>/g, ''))
                    .join('');

                  const unescaped = unescapeXml(line).trim();
                  if (unescaped.length > 0) {
                    extractedLines.push(unescaped);
                  }
                }

                resolve(extractedLines.join('\n\n'));
              } catch (parseErr: any) {
                reject(new Error(`Failed to parse DOCX structure: ${parseErr.message}`));
              }
            });
            readStream.on('error', (err) => reject(err));
          });
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on('end', () => {
        if (!documentXmlFound) {
          resolve('');
        }
      });

      zipfile.on('error', (err) => reject(err));
    });
  });
}

/**
 * Helper to obtain available AI clients with NVIDIA as primary provider.
 */
function getAiClients(): Array<{ client: OpenAI; provider: 'nvidia' | 'openai'; models: string[] }> {
  const clients: Array<{ client: OpenAI; provider: 'nvidia' | 'openai'; models: string[] }> = [];

  if (env.NVIDIA_API_KEY && env.NVIDIA_API_KEY.trim().length > 5) {
    clients.push({
      client: new OpenAI({
        apiKey: env.NVIDIA_API_KEY,
        baseURL: 'https://integrate.api.nvidia.com/v1',
        timeout: 25000,
      }),
      provider: 'nvidia',
      models: [
        'meta/llama-3.2-11b-vision-instruct',
        'meta/llama-3.2-90b-vision-instruct',
      ],
    });
  }

  if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 5) {
    clients.push({
      client: new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        timeout: 25000,
      }),
      provider: 'openai',
      models: ['gpt-4o-mini', 'gpt-4o'],
    });
  }

  return clients;
}

/**
 * Detects if an individual line contains AI-generated image descriptions,
 * visual appearance observations, mobile UI noise, or status bar indicators.
 */
export function isImageDescriptionNoise(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;

  // 1. Image / Screenshot conversational opening & observational statements
  if (
    /^(?:the\s+(?:image|screenshot|photo|document|picture|graphic)\s+(?:shows|appears\s+to|contains|is|features|depicts|displays|seems\s+to|illustrates|presents|includes|consists\s+of)|in\s+the\s+(?:image|screenshot|photo|picture|graphic)|this\s+(?:image|screenshot|photo|picture)\s+(?:shows|contains|displays|presents|depicts|appears)|overall,?\s+the\s+(?:image|screenshot|photo|picture)|from\s+the\s+(?:image|screenshot|photo|picture)|based\s+on\s+the\s+(?:image|screenshot|photo)|as\s+seen\s+in\s+the\s+(?:image|screenshot)|looking\s+at\s+the\s+(?:image|screenshot))/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // 2. Spatial UI / layout descriptions (e.g. "The title at the top reads...", "At the top left of the screen...", "The background of the image is...")
  if (
    /^(?:the\s+title\s+(?:at\s+the\s+top\s+)?reads|below\s+the\s+title|at\s+the\s+(?:top|bottom|left|right|center)(?:\s+(?:left|right|top|bottom))?\s+(?:of\s+the\s+)?(?:screen|image|page|document|picture|photo)|on\s+the\s+(?:top|bottom|left|right)(?:\s+(?:left|right|top|bottom))?\s+(?:side|corner|portion)?|the\s+background\s+(?:of\s+the\s+(?:image|photo|picture)\s+)?is|the\s+header\s+(?:at\s+the\s+top\s+)?(?:shows|reads|displays)|the\s+footer\s+(?:shows|reads|displays))/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // 3. Mobile device UI, status bar, signal, battery, wifi, navigation bar descriptions
  if (
    /^(?:battery(?:\s*:\s*\d+%|\s+level|\s+percentage|\s+icon)?|wi-?fi(?:\s+icon|\s+signal)?|signal\s+strength|network\s+status|navigation\s+bar|notification\s+bar|status\s+bar|system\s+icons?)\b/i.test(
      trimmed
    ) ||
    /(?:battery(?:\s*:\s*\d+%|\s+level|\s+percentage)|(?:9\d|100)%\s*battery|\b5g\b|\b4g\b|\blte\b|\bwi-fi\b)/i.test(trimmed) && /(?:time\s+is|status\s+bar|signal|screen)/i.test(trimmed)
  ) {
    return true;
  }

  // 4. Standalone status bar clock/signal/battery lines (e.g., "12:45 PM | 100% | 5G" or "9:41 AM 4G 100%")
  if (
    /^(?:\d{1,2}:\d{2}(?:\s?[ap]m)?[\s|•·/,-]*)?(?:(?:\d{1,3}%|wifi|wi-fi|lte|4g|5g|volte|battery|signal|bluetooth|alarm|mute)[\s|•·/,-]*)+$/i.test(
      trimmed
    )
  ) {
    return true;
  }

  // 5. General AI assistant chatter / disclaimers
  if (
    /^(?:here\s+(?:is|are|'s)\s+(?:the\s+)?(?:actual\s+)?(?:transcribed|extracted|syllabus|lesson\s+plan|text)[^:\n]*:?|note:\s*|please\s+note\s+that|let\s+me\s+know\s+if|i\s+hope\s+this\s+helps|please\s+check\s+the\s+course\s+website)\b/i.test(
      trimmed
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Cleans extracted text by stripping conversational LLM artifacts, think blocks,
 * code fences, image description noise, device UI elements, and disclaimers.
 * Preserves all legitimate syllabus headings, units, topics, revision, tutorials, seminars, and COs.
 */
export function cleanExtractedText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // Remove <think>...</think> reasoning blocks if produced by reasoning/thinking models
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Strip wrapping markdown code blocks if the whole response is enclosed in backticks
  text = text.replace(/^```(?:markdown|text)?\r?\n([\s\S]*?)\r?\n```$/i, '$1');

  // Filter line by line to eliminate AI-generated image descriptions and device UI noise
  const lines = text.split(/\r?\n/);
  const filteredLines = lines.filter((line) => !isImageDescriptionNoise(line));

  text = filteredLines.join('\n');

  // Remove separator lines
  text = text.replace(/^={3,}\s*.*?\s*={3,}$/gm, '');

  // Clean excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  // If structured syllabus units can be extracted, return standard formatted syllabus outline
  const structuredUnits = parseAndStructureSyllabus(text);
  if (structuredUnits.length > 0 && structuredUnits.some((u) => u.topics.length > 0)) {
    return formatSyllabusForDisplay(structuredUnits);
  }

  return text;
}

/**
 * Detects if a line contains standalone administrative/calendar/activity entries
 * (e.g. Revision of Mid-1, Mid Exams, Seminars, Campus Drive, leave adjustment, UI topic counts)
 * rather than authentic syllabus topics.
 */
export function isActivityOrJunkLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;

  // 1. UI metadata like '10 Topics', '25 Topics', '1 Topic', '8 Topics'
  if (/^\d+\s*Topics?$/i.test(t)) return true;

  // 2. Administrative / standalone activity entries
  if (
    /^(?:Revision(?:\s*(?:of\s*)?Mid[-\s]?\d*|\s*\d+)?|Mid\s*Exams?\s*\d*|Mid\s*Revision\s*\d*|Seminar(?:\s+.*|\s*\d+)?|Campus\s*Drive|leave\s+adjusted(?:\s+.*)?|REVISION\s*\d*)$/i.test(
      t
    )
  ) {
    return true;
  }

  // 3. Test / dummy tokens
  if (/^(?:test\s*\d*|introduction(?:to)?\s*big\s*data|dummy\s*\d*|sample\s*\d*)$/i.test(t)) {
    return true;
  }

  return false;
}

/**
 * Checks whether a detected unit number or title represents an invalid, dummy,
 * or activity-based pseudo-unit (e.g., Unit 1: Revision of Mid-1, Unit 999: Custom Unit).
 */
export function isInvalidUnitHeading(num: number | undefined, title: string): boolean {
  if (num === undefined || num <= 0 || num > 50) return true;
  if (num === 999 || num === 9999) return true;

  const cleanTitle = (title || '').trim().toLowerCase();
  if (
    /^(?:revision(?:\s*(?:of\s*)?mid[-\s]?\d*|\s*\d+)?|mid\s*(?:exams?|term|revisions?)[-\s]?\d*|seminars?|campus\s*drive|leave\s*adjusted|custom\s*unit|test\s*\d*|crt\s*revision)/i.test(
      cleanTitle
    )
  ) {
    return true;
  }
  return false;
}

export interface StructuredUnitItem {
  unitNumber: number;
  title: string;
  topics: string[];
}

/**
 * Robust syllabus structure parser:
 * Identifies legitimate syllabus units, filters out unrelated activities/dummy units,
 * merges overlapping unit fragments across multiple uploaded pages, and dedupes topics.
 */
export function parseAndStructureSyllabus(rawText: string): StructuredUnitItem[] {
  if (!rawText || !rawText.trim()) return [];

  const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const unitHeaderRegex = /^(?:[*–-])?\s*(?:\*{1,3}|_{1,3})?\s*(?:Unit|Module|Chapter|Part|Section)\s*([0-9IVXLCDM]+|[a-zA-Z]+)?\s*[:.—)-]\s*(.*?)(?:\*{1,3}|_{1,3})?$/i;
  const unitHeaderStandaloneRegex = /^(?:[*–-])?\s*(?:\*{1,3}|_{1,3})?\s*(?:Unit|Module|Chapter|Part|Section)\s*([0-9IVXLCDM]+)\s*(?:\*{1,3}|_{1,3})?$/i;

  const unitsMap = new Map<number, { title: string; topics: string[] }>();
  let currentUnitNum: number | null = null;

  for (const line of rawLines) {
    if (isImageDescriptionNoise(line)) continue;

    const match = line.match(unitHeaderRegex);
    const standMatch = line.match(unitHeaderStandaloneRegex);

    if (match || standMatch) {
      const numStr = match ? match[1] || '' : standMatch![1] || '';
      const titleStr = match ? match[2] || '' : '';

      let num: number | undefined;
      if (/^[0-9]+$/.test(numStr)) {
        num = parseInt(numStr, 10);
      } else if (/^[IVXLCDM]+$/i.test(numStr)) {
        const rMap: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
        num = rMap[numStr.toUpperCase()] || 1;
      }

      if (num && !isInvalidUnitHeading(num, titleStr)) {
        currentUnitNum = num;
        let cleanTitle = titleStr.replace(/^[:.—)\s-]+/, '').replace(/[*_]/g, '').trim();
        if (!cleanTitle) cleanTitle = `UNIT ${num}`;

        if (!unitsMap.has(num)) {
          unitsMap.set(num, { title: cleanTitle, topics: [] });
        } else {
          // If existing unit had generic/shorter title, update if this one is more descriptive
          const existing = unitsMap.get(num)!;
          if (cleanTitle !== `UNIT ${num}` && (existing.title === `UNIT ${num}` || cleanTitle.length > existing.title.length)) {
            existing.title = cleanTitle;
          }
        }
      } else {
        // Invalid unit heading (like Unit 1: Revision of Mid-1 or Unit 999) -> reset currentUnitNum so topics under it are ignored
        currentUnitNum = null;
      }
      continue;
    }

    // Process topic line if currently under a valid unit
    if (currentUnitNum && unitsMap.has(currentUnitNum)) {
      if (isActivityOrJunkLine(line)) continue;

      const cleanTopic = line
        .replace(/^[•*+>#\d.)\s-]+/, '')
        .replace(/[*_]/g, '')
        .replace(/[,–\s-]+$/, '')
        .trim();

      if (cleanTopic.length > 1) {
        const unitObj = unitsMap.get(currentUnitNum)!;
        if (!unitObj.topics.some((t) => t.toLowerCase() === cleanTopic.toLowerCase())) {
          unitObj.topics.push(cleanTopic);
        }
      }
    }
  }

  // Sort units sequentially 1..N
  const sorted = Array.from(unitsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([num, u]) => ({
      unitNumber: num,
      title: u.title,
      topics: u.topics,
    }));

  return sorted;
}

/**
 * Formats structured units into standard syllabus outline format.
 */
export function formatSyllabusForDisplay(units: StructuredUnitItem[]): string {
  if (!units || units.length === 0) return '';
  return units
    .map((u) => {
      const header = `Unit ${u.unitNumber}: ${u.title}`;
      const topicList = u.topics.map((t) => `- ${t}`).join('\n');
      return `${header}\n${topicList}`;
    })
    .join('\n\n');
}

/**
 * Evaluates whether the cleaned extracted text contains actual syllabus/lesson-plan content,
 * and is not empty or composed solely of residual noise.
 */
export function isMeaningfulSyllabusText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const cleaned = cleanExtractedText(text);
  if (!cleaned || cleaned.length < 5) return false;

  // Must contain at least 4 alphanumeric characters
  const alphaNumericCount = (cleaned.match(/[a-zA-Z0-9]/g) || []).length;
  if (alphaNumericCount < 4) return false;

  // Ensure it is not just leftover image description noise
  const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const validSyllabusLines = lines.filter((l) => !isImageDescriptionNoise(l) && !isActivityOrJunkLine(l));

  return validSyllabusLines.length > 0;
}

/**
 * Runs Vision OCR on an image buffer / base64 data URL using the unified HandwritingOcrService
 * (Gemini 2.5 Flash as primary, with NVIDIA NIM and OpenAI as fallbacks).
 * Accurately transcribes visible handwritten and printed text with zero visual appearance descriptions.
 */
export async function performVisionOcr(
  imageBuffer: Buffer,
  mimeType: string = 'image/png',
  filename?: string,
  purpose: DocumentPurpose = 'syllabus'
): Promise<string> {
  try {
    const ocrResult = await HandwritingOcrService.extractFromImageBuffer(imageBuffer, {
      filename,
      mimeType,
      purpose,
    });

    if (ocrResult && ocrResult.text.trim()) {
      return ocrResult.text.trim();
    }
  } catch (err: any) {
    logger.warn({ error: err.message, filename }, '[performVisionOcr] HandwritingOcrService failed, trying direct fallback');
  }

  // Fallback to legacy clients if needed
  const clients = getAiClients();
  if (clients.length === 0) {
    throw new Error('No AI vision provider configured. Please set GEMINI_API_KEY or NVIDIA_API_KEY in your .env file.');
  }

  const base64Image = imageBuffer.toString('base64');
  let cleanMime = 'image/jpeg';
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerFilename = (filename || '').toLowerCase();

  if (lowerMime.includes('png') || lowerFilename.endsWith('.png')) {
    cleanMime = 'image/png';
  } else if (lowerMime.includes('webp') || lowerFilename.endsWith('.webp')) {
    cleanMime = 'image/webp';
  } else if (lowerMime.includes('gif') || lowerFilename.endsWith('.gif')) {
    cleanMime = 'image/gif';
  } else {
    cleanMime = 'image/jpeg';
  }

  const dataUrl = `data:${cleanMime};base64,${base64Image}`;
  const prompt =
    'You are extracting text from a document or educational sheet.\n' +
    'Transcribe all visible printed and handwritten text verbatim.\n' +
    'Do NOT describe the image, photo, device, screen, UI, or visual appearance.\n' +
    'Do not invent or summarize content. If handwriting is illegible, write [unreadable handwriting].\n' +
    'Output ONLY the extracted document text.';

  let lastError: any = null;

  for (const { client, models } of clients) {
    for (const model of models) {
      try {
        const response = await client.chat.completions.create({
          model,
          temperature: 0.0,
          max_tokens: 3072,
          messages: [
            { role: 'system', content: prompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract all text from this document image:' },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
        });

        const rawExtracted = response.choices[0]?.message?.content?.trim() || '';
        const extracted = cleanExtractedText(rawExtracted);

        if (extracted.length > 5) {
          return extracted;
        }
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  throw new Error(`OCR processing failed: ${lastError?.message || 'Unable to extract meaningful content from image'}`);
}

/**
 * Evaluates whether natively extracted PDF text is usable (not empty or just whitespace/garbage).
 */
function isUsablePdfText(text: string): boolean {
  if (!text) return false;
  // Remove all whitespace
  const nonWhitespace = text.replace(/\s+/g, '');
  if (nonWhitespace.length < 40) return false;

  // Check alphanumeric density
  const alphanumeric = text.replace(/[^a-zA-Z0-9]/g, '');
  return alphanumeric.length >= 25;
}

/**
 * Extracts text from a PDF buffer.
 * 1. Attempts native PDF text extraction first.
 * 2. If usable machine-readable text is found, returns it.
 * 3. If the PDF is scanned/image-based (< 40 chars), attempts OCR fallback.
 */
export async function extractTextFromPdf(buffer: Buffer, filename?: string): Promise<string> {
  let nativeText = '';
  try {
    const pdfData = await pdfParse(buffer);
    nativeText = (pdfData.text || '').trim();
  } catch (parseErr: any) {
    logger.warn({ error: parseErr, filename }, '[extractTextFromPdf] Native pdf-parse failed');
  }

  // If native extraction yielded meaningful text, return it immediately
  if (isUsablePdfText(nativeText)) {
    return nativeText;
  }

  logger.info({ filename }, '[extractTextFromPdf] Scanned or empty PDF detected, attempting OCR fallback...');

  // Fallback for scanned PDF:
  // Extract embedded images or search for image streams in PDF buffer
  try {
    // Scan PDF buffer for embedded JPEG/PNG streams
    const images = extractEmbeddedImagesFromPdfBuffer(buffer);
    if (images.length > 0) {
      const ocrPages: string[] = [];
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        const img = images[i];
        try {
          const ocrText = await performVisionOcr(img.buffer, img.mimeType, `${filename || 'document'}-page-${i + 1}`);
          if (ocrText.trim()) {
            ocrPages.push(ocrText.trim());
          }
        } catch (imgErr) {
          logger.warn({ error: imgErr, page: i + 1 }, '[extractTextFromPdf] Page OCR failed');
        }
      }

      if (ocrPages.length > 0) {
        return ocrPages.join('\n\n--- Page Break ---\n\n');
      }
    }
  } catch (ocrFallbackErr) {
    logger.warn({ error: ocrFallbackErr, filename }, '[extractTextFromPdf] PDF OCR fallback failed');
  }

  // If native text had some content (even if short), return it; otherwise return informative message or error
  if (nativeText) {
    return nativeText;
  }

  throw new Error(`Unable to extract text from PDF "${filename || 'uploaded file'}". The file appears to be scanned or contains no readable text.`);
}

/**
 * Fast embedded JPEG/PNG image stream extractor from raw PDF buffer.
 */
function extractEmbeddedImagesFromPdfBuffer(buffer: Buffer): Array<{ buffer: Buffer; mimeType: string }> {
  const images: Array<{ buffer: Buffer; mimeType: string }> = [];

  // Search for JPEG markers: 0xFF 0xD8 ... 0xFF 0xD9
  let offset = 0;
  while (offset < buffer.length - 4 && images.length < 15) {
    const start = buffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]), offset);
    if (start === -1) break;

    const end = buffer.indexOf(Buffer.from([0xff, 0xd9]), start + 3);
    if (end === -1) {
      offset = start + 3;
      continue;
    }

    const jpegLength = end + 2 - start;
    if (jpegLength > 2048) {
      // Must be at least 2KB to be a real document page image
      const imgBuf = buffer.subarray(start, end + 2);
      images.push({ buffer: imgBuf, mimeType: 'image/jpeg' });
    }
    offset = end + 2;
  }

  return images;
}

/**
 * Extracts textual content from an individual file buffer based on its extension / MIME type.
 */
export async function extractTextFromFileBuffer(
  buffer: Buffer,
  filename: string,
  mimetype?: string,
  purpose: DocumentPurpose = 'general'
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error(`File "${filename}" is empty.`);
  }

  const ext = path.extname(filename).toLowerCase();
  const mime = (mimetype || '').toLowerCase();

  // 1. Text / Markdown
  if (ext === '.txt' || mime === 'text/plain') {
    const text = buffer.toString('utf8');
    return text.trim();
  }

  if (ext === '.md' || ext === '.markdown' || mime === 'text/markdown' || mime === 'text/x-markdown') {
    const text = buffer.toString('utf8');
    return text.trim();
  }

  // 2. DOCX Word documents
  if (
    ext === '.docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const text = await extractTextFromDocx(buffer);
    if (!text.trim()) {
      throw new Error(`No textual content found in DOCX file "${filename}".`);
    }
    return text.trim();
  }

  // 3. Legacy DOC files
  if (ext === '.doc' || mime === 'application/msword') {
    // Attempt extracting printable text strings from legacy DOC binary
    const raw = buffer.toString('binary');
    const strings = raw.match(/[\x20-\x7E\r\n\t]{4,}/g) || [];
    const filtered = strings
      .filter((s) => !/^(Root Entry|WordDocument|CompObj|ObjectPool|SummaryInformation)/i.test(s))
      .join('\n')
      .trim();

    if (filtered.length >= 30) {
      return filtered;
    }
    throw new Error(`Legacy .doc format is partially supported. For best results, please save as .docx or .pdf.`);
  }

  // 4. PDF files
  if (ext === '.pdf' || mime === 'application/pdf' || mime === 'application/x-pdf') {
    return await extractTextFromPdf(buffer, filename);
  }

  // 5. CSV and TSV spreadsheet/data files
  if (ext === '.csv' || ext === '.tsv' || mime.includes('csv') || mime.includes('tab-separated')) {
    const text = buffer.toString('utf8');
    return text.trim();
  }

  // 6. JSON data files
  if (ext === '.json' || mime === 'application/json') {
    try {
      const parsed = JSON.parse(buffer.toString('utf8'));
      return JSON.stringify(parsed, null, 2);
    } catch {
      return buffer.toString('utf8').trim();
    }
  }

  // 7. HTML / Web pages
  if (ext === '.html' || ext === '.htm' || mime.includes('html')) {
    const raw = buffer.toString('utf8');
    // Strip HTML tags and keep content
    const stripped = raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return stripped;
  }

  // 8. RTF Rich Text Format
  if (ext === '.rtf' || mime.includes('rtf')) {
    const raw = buffer.toString('utf8');
    const stripped = raw.replace(/\\[a-z0-9-]+\s?/gi, ' ').replace(/[{}]/g, '').trim();
    return stripped;
  }

  // 9. Image files (PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF)
  if (
    ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff'].includes(ext) ||
    mime.startsWith('image/')
  ) {
    const imageMime = mime.startsWith('image/') ? mime : ext === '.png' ? 'image/png' : 'image/jpeg';
    const text = await performVisionOcr(buffer, imageMime, filename, purpose);
    if (!text.trim()) {
      throw new Error(`OCR was unable to detect any visible text in image "${filename}".`);
    }
    return text.trim();
  }

  // Fallback: If text-like buffer, attempt utf8 conversion
  const rawUtf8 = buffer.toString('utf8');
  if (rawUtf8 && /^[\x20-\x7E\r\n\t\u00A0-\uFFFF]{10,}$/.test(rawUtf8.slice(0, 500))) {
    return rawUtf8.trim();
  }

  throw new Error(
    `Unsupported file type "${ext || mime}". Supported formats: PDF, DOCX, DOC, PNG, JPG, JPEG, WEBP, TXT, MD, CSV, JSON, HTML.`
  );
}

/**
 * Processes a single uploaded Multer file and cleans up disk temporary file.
 */
export async function processUploadedFile(
  file: Express.Multer.File,
  purpose: DocumentPurpose = 'general'
): Promise<FileExtractionResult> {
  const filename = file.originalname || path.basename(file.path);
  const fileType = file.mimetype || 'application/octet-stream';

  try {
    const buffer = fs.readFileSync(file.path);
    const extractedText = await extractTextFromFileBuffer(buffer, filename, fileType, purpose);

    return {
      filename,
      fileType,
      status: 'success',
      extractedText,
    };
  } catch (err: any) {
    logger.error({ error: err.message, filename }, '[processUploadedFile] Extraction failed');
    return {
      filename,
      fileType,
      status: 'error',
      error: err.message || 'Failed to extract text from file',
    };
  } finally {
    // Clean up temporary upload file
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkErr) {
        logger.warn({ error: unlinkErr, path: file.path }, '[processUploadedFile] Failed to unlink temp file');
      }
    }
  }
}

/**
 * Batch processes an array of uploaded files independently, preserving order and formatting multi-file results.
 */
export async function processUploadedFiles(
  files: Express.Multer.File[],
  purpose: DocumentPurpose = 'general'
): Promise<BatchExtractionOutput> {
  if (!files || files.length === 0) {
    throw new Error('No files provided for extraction');
  }

  const results: FileExtractionResult[] = new Array(files.length);
  const CONCURRENCY = 3;
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < files.length) {
      const idx = currentIndex++;
      const file = files[idx];
      results[idx] = await processUploadedFile(file, purpose);
    }
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker());
  await Promise.all(workers);

  // Combine successful extractions with deterministic separators
  const successfulResults = results.filter((r) => r && r.status === 'success' && r.extractedText);

  let combinedContent = '';

  if (successfulResults.length === 1 && results.length === 1) {
    // Single file upload: output text directly
    combinedContent = successfulResults[0].extractedText || '';
  } else if (successfulResults.length > 0) {
    // Multiple files: output with clear, distinct section headers
    combinedContent = successfulResults
      .map((r) => `===== ${r.filename} =====\n\n${r.extractedText}`)
      .join('\n\n\n');
  }

  return {
    content: combinedContent,
    results,
  };
}

/**
 * Extracts text directly from a file stored in Cloudflare R2 without saving to local disk.
 */
export async function extractTextFromR2(
  key: string,
  originalFilename?: string,
  mimeType?: string
): Promise<string> {
  const r2 = getR2Storage();
  const buffer = await r2.get(key);
  if (!buffer) {
    throw new Error(`File not found in R2 storage for key: ${key}`);
  }

  const filename = originalFilename || path.basename(key);
  const type = mimeType || 'application/octet-stream';

  return extractTextFromFileBuffer(buffer, filename, type);
}

