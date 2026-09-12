import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectImageMimeType,
  computeImageHash,
  preprocessImageForOcr,
} from '../services/ocr/image-preprocessor';
import {
  parseAnswerSheetText,
  formatParsedAnswersForGrading,
} from '../services/ocr/answer-sheet-parser';
import {
  HandwritingOcrService,
} from '../services/ocr/handwriting-ocr.service';
import { extractTextFromFileBuffer } from '../services/document-extractor.service';

describe('Handwriting OCR & Phone-Camera Pipeline', () => {
  // Mock image buffers
  const mockPngBuffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(40, 0),
  ]);

  const mockJpegBuffer = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
    Buffer.alloc(100, 0),
  ]);

  describe('1. Image Preprocessing & Phone Photo Normalization', () => {
    it('reliably detects image MIME types from binary magic numbers', () => {
      expect(detectImageMimeType(mockPngBuffer)).toBe('image/png');
      expect(detectImageMimeType(mockJpegBuffer)).toBe('image/jpeg');

      const webpHeader = Buffer.from('RIFF1234WEBPVP8 ');
      expect(detectImageMimeType(webpHeader)).toBe('image/webp');

      const gifHeader = Buffer.from('GIF89a...');
      expect(detectImageMimeType(gifHeader)).toBe('image/gif');

      const bmpHeader = Buffer.from('BM123456');
      expect(detectImageMimeType(bmpHeader)).toBe('image/bmp');
    });

    it('computes deterministic SHA-256 hashes for caching and deduplication', () => {
      const hash1 = computeImageHash(mockPngBuffer);
      const hash2 = computeImageHash(mockPngBuffer);
      const hashJpeg = computeImageHash(mockJpegBuffer);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).not.toBe(hashJpeg);
    });

    it('preprocesses phone-camera photos and generates deskew / shadow enhancement prompts', () => {
      // Simulate high-res 400KB phone camera capture
      const phonePhotoBuffer = Buffer.alloc(450_000, 0xff);
      phonePhotoBuffer[0] = 0xff;
      phonePhotoBuffer[1] = 0xd8;
      phonePhotoBuffer[2] = 0xff;

      const preprocessed = preprocessImageForOcr(phonePhotoBuffer, 'IMG_20260912_1423.jpg');

      expect(preprocessed.mimeType).toBe('image/jpeg');
      expect(preprocessed.isLikelyPhonePhoto).toBe(true);
      expect(preprocessed.dataUrl).toContain('data:image/jpeg;base64,');
      expect(preprocessed.enhancementPromptHints).toContain(
        'Auto-correct any tilted, slanted, or perspective-distorted document boundaries.'
      );
      expect(preprocessed.enhancementPromptHints).toContain(
        'Normalize lighting gradients, cast shadows (e.g. hand/phone shadows), and glare.'
      );
      expect(preprocessed.enhancementPromptHints).toContain(
        'Automatically detect page orientation: if text is rotated 90°, 180°, or 270°, transcribe in the natural reading direction.'
      );
    });
  });

  describe('2. Handwritten Answer Sheet & Question Parsing', () => {
    it('correctly parses structured student answer sheets with question numbers and steps', () => {
      const sampleOcrText = `
Section A

Question 1:
Given matrix A = [[1, 2], [3, 4]]
Step 1: Calculate det(A) = (1*4) - (2*3) = 4 - 6 = -2
Step 2: Since det(A) != 0, inverse exists.
Therefore A^-1 = (1/-2) * [[4, -2], [-3, 1]]
Ans: [[-2, 1], [1.5, -0.5]]

Q2(a):
Newton's Second Law states that F = m * a
Given: m = 10 kg, a = 9.8 m/s^2
Calculation: F = 10 * 9.8 = 98 N
Final Answer: 98 N

(b):
Define inertia.
Inertia is the inherent property of a body to resist any change in its state of rest or uniform motion.
`;

      const parsed = parseAnswerSheetText(sampleOcrText);

      expect(parsed.parsedQuestions).toHaveLength(3);
      expect(parsed.parsedQuestions[0].questionNumber).toBe('Q1');
      expect(parsed.parsedQuestions[0].studentAnswer).toContain('Calculate det(A)');
      expect(parsed.parsedQuestions[0].finalAnswer).toBe('Ans: [[-2, 1], [1.5, -0.5]]');

      expect(parsed.parsedQuestions[1].questionNumber).toBe('Q2(a)');
      expect(parsed.parsedQuestions[1].finalAnswer).toBe('Final Answer: 98 N');

      expect(parsed.parsedQuestions[2].questionNumber).toBe('Q2(b)');
      expect(parsed.parsedQuestions[2].studentAnswer).toContain('Inertia is the inherent property');

      expect(parsed.overallConfidence).toBeGreaterThanOrEqual(90);
      expect(parsed.needsHumanReview).toBe(false);
      expect(parsed.unreadableRegionsTotal).toBe(0);
    });

    it('identifies unreadable handwriting markers and flags for review without hallucinating', () => {
      const poorHandwritingSample = `
Question 1:
The photosynthetic light reaction occurs in the thylakoid membrane.
Chlorophyll absorbs [unreadable handwriting] at 680nm.
Step 2: Water is split into protons and [unreadable handwriting].

Question 2:
[unreadable handwriting] is the rate limiting enzyme.
`;

      const parsed = parseAnswerSheetText(poorHandwritingSample);

      expect(parsed.unreadableRegionsTotal).toBe(3);
      expect(parsed.needsHumanReview).toBe(true);
      expect(parsed.overallConfidence).toBeLessThan(80);
      expect(parsed.parsedQuestions[0].unreadableSegmentsCount).toBe(2);
      expect(parsed.parsedQuestions[1].unreadableSegmentsCount).toBe(1);
    });

    it('formats parsed questions and steps into clean Markdown for grading', () => {
      const parsed = parseAnswerSheetText(`
Q1:
Explain Ohm's law.
V = I * R
Current is directly proportional to voltage at constant temperature.
Ans: V = IR
`);

      const formatted = formatParsedAnswersForGrading(parsed.parsedQuestions);
      expect(formatted).toContain('### Q1');
      expect(formatted).toContain('Explain Ohm\'s law.');
      expect(formatted).toContain('V = I * R');
      expect(formatted).toContain('**Final Result:** Ans: V = IR');
    });
  });

  describe('3. Handwriting OCR Service Execution & Caching', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('uses Gemini 2.5 Flash as primary vision tier for handwriting and caches result', async () => {
      const sampleText = `Question 1: Handwritten calculus derivation\nd/dx (x^3 + 2x) = 3x^2 + 2\nAns: 3x^2 + 2`;

      // Mock GeminiProvider generate
      const geminiSpy = vi
        .spyOn(HandwritingOcrService['geminiProvider'], 'generate')
        .mockResolvedValue(sampleText);
      vi.spyOn(HandwritingOcrService['geminiProvider'], 'isConfigured').mockReturnValue(true);

      const buffer = Buffer.concat([mockJpegBuffer, Buffer.from('test-image-content-1')]);

      // 1st call: runs model
      const result1 = await HandwritingOcrService.extractFromImageBuffer(buffer, {
        filename: 'answer-sheet-p1.jpg',
        purpose: 'answer_sheet',
      });

      expect(geminiSpy).toHaveBeenCalledTimes(1);
      expect(result1.text).toContain('Handwritten calculus derivation');
      expect(result1.modelUsed).toBe('gemini-2.5-flash');
      expect(result1.isCached).toBe(false);
      expect(result1.structuredAnswerSheet?.parsedQuestions).toHaveLength(1);

      // 2nd call: instant in-memory cache hit (< 5ms, 0 model calls)
      const result2 = await HandwritingOcrService.extractFromImageBuffer(buffer, {
        filename: 'answer-sheet-p1.jpg',
        purpose: 'answer_sheet',
      });

      expect(geminiSpy).toHaveBeenCalledTimes(1); // Still 1 call!
      expect(result2.isCached).toBe(true);
      expect(result2.text).toBe(result1.text);
      expect(result2.hash).toBe(result1.hash);
    });

    it('strips camera and phone UI noise while preserving genuine handwritten notes', async () => {
      const rawWithNoise = `
The image shows a phone photograph of handwritten study notes.
At the top left of the screen, the time is 10:45 AM | 95% Battery | 5G.
The background is a wooden study table with some shadows.

# Lecture Notes: Computer Networks
- Protocol Data Unit (PDU) at Transport Layer: Segment
- Three-Way Handshake: SYN -> SYN-ACK -> ACK
- [Diagram: State transition diagram of TCP connection with LISTEN, SYN_SENT, ESTABLISHED]

Overall, the photograph contains student handwritten notes.
`;

      vi.spyOn(HandwritingOcrService['geminiProvider'], 'generate').mockResolvedValue(rawWithNoise);
      vi.spyOn(HandwritingOcrService['geminiProvider'], 'isConfigured').mockReturnValue(true);

      const buffer = Buffer.concat([mockJpegBuffer, Buffer.from('test-noise-strip')]);
      const result = await HandwritingOcrService.extractFromImageBuffer(buffer, {
        filename: 'notes.jpg',
        purpose: 'handwritten_notes',
      });

      expect(result.text).not.toContain('The image shows');
      expect(result.text).not.toContain('10:45 AM');
      expect(result.text).not.toContain('The background is a wooden');
      expect(result.text).not.toContain('Overall, the photograph');

      expect(result.text).toContain('# Lecture Notes: Computer Networks');
      expect(result.text).toContain('Three-Way Handshake: SYN -> SYN-ACK -> ACK');
      expect(result.text).toContain('[Diagram: State transition diagram of TCP connection with LISTEN, SYN_SENT, ESTABLISHED]');
    });

    it('processes multi-page batches progressively and maintains correct page order', async () => {
      const page1Text = 'Question 1: Page 1 Answer Content';
      const page2Text = 'Question 2: Page 2 Answer Content';

      vi.spyOn(HandwritingOcrService['geminiProvider'], 'generate')
        .mockResolvedValueOnce(page1Text)
        .mockResolvedValueOnce(page2Text);
      vi.spyOn(HandwritingOcrService['geminiProvider'], 'isConfigured').mockReturnValue(true);

      const images = [
        { buffer: Buffer.concat([mockPngBuffer, Buffer.from('page-1')]), filename: 'scan-p1.png' },
        { buffer: Buffer.concat([mockPngBuffer, Buffer.from('page-2')]), filename: 'scan-p2.png' },
      ];

      const progressUpdates: any[] = [];
      const batchResults = await HandwritingOcrService.extractBatchProgressive(images, {
        purpose: 'answer_sheet',
        onProgress: (p) => progressUpdates.push(p),
      });

      expect(batchResults).toHaveLength(2);
      expect(batchResults[0].text).toContain('Page 1 Answer Content');
      expect(batchResults[1].text).toContain('Page 2 Answer Content');
      expect(progressUpdates).toHaveLength(2);
      expect(progressUpdates[0].page).toBe(1);
      expect(progressUpdates[1].page).toBe(2);
    });
  });

  describe('4. Router Integration with document-extractor.service', () => {
    it('routes image extractions through HandwritingOcrService seamlessly', async () => {
      const extractedContent = 'Unit 1: Artificial Intelligence & Machine Learning\nTopics: Neural Networks, Backprop';
      vi.spyOn(HandwritingOcrService['geminiProvider'], 'generate').mockResolvedValue(extractedContent);
      vi.spyOn(HandwritingOcrService['geminiProvider'], 'isConfigured').mockReturnValue(true);

      const buffer = Buffer.concat([mockPngBuffer, Buffer.from('syllabus-img-test')]);
      const text = await extractTextFromFileBuffer(buffer, 'handwritten-syllabus.png', 'image/png', 'syllabus');

      expect(text).toContain('Unit 1: Artificial Intelligence & Machine Learning');
      expect(text).toContain('Topics: Neural Networks, Backprop');
    });
  });
});
