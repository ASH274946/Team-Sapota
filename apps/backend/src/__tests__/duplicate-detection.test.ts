import { describe, it, expect, vi } from 'vitest';
import { DuplicateDetectionService, CandidateQuestionInput } from '../services/duplicate-detection.service';

vi.mock('../services/rag/vector-search.service', () => {
  return {
    getEmbedding: vi.fn().mockImplementation(async (text: string) => {
      const norm = text.toLowerCase();
      if (norm.includes('binary search') || norm.includes('divide and conquer search')) {
        const v = new Array(1536).fill(0.1);
        v[0] = 0.9;
        return v;
      }
      if (norm.includes('sql join') || norm.includes('relational query join')) {
        const v = new Array(1536).fill(0.5);
        v[1] = 0.9;
        return v;
      }
      if (norm.includes('photosynthesis') || norm.includes('plant light energy')) {
        const v = new Array(1536).fill(0.9);
        v[2] = 0.9;
        return v;
      }

      // Generate distinct deterministic vectors for unrelated texts
      const hash = Array.from(norm).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const vector = new Array(1536).fill(0.01);
      vector[hash % 1536] = 1.0;
      return vector;
    }),
  };
});

describe('DuplicateDetectionService - Multi-Tier Detection Engine', () => {
  // ── Stage 1: Exact Hash & Normalization Tests ─────────────────────────────
  it('normalizes text and generates deterministic SHA-256 hashes', () => {
    const raw1 = '  What IS the   Time Complexity of   QuickSort? \n ';
    const raw2 = 'What is the time complexity of quicksort?';

    const norm1 = DuplicateDetectionService.normalizeText(raw1);
    const norm2 = DuplicateDetectionService.normalizeText(raw2);

    expect(norm1).toBe(norm2);

    const hash1 = DuplicateDetectionService.computeExactHash(raw1);
    const hash2 = DuplicateDetectionService.computeExactHash(raw2);

    expect(hash1).toBe(hash2);
  });

  it('preserves mathematical and programming operators during normalization', () => {
    const mathText = 'Solve for x: 2 + 3 * x = 11 where x > 0';
    const norm = DuplicateDetectionService.normalizeText(mathText);

    expect(norm).toContain('+');
    expect(norm).toContain('*');
    expect(norm).toContain('=');
    expect(norm).toContain('>');
  });

  it('Stage 1: Short-circuits immediately on exact hash matches', async () => {
    const target: CandidateQuestionInput = {
      id: 'q-target',
      content: 'Explain the working of Binary Search tree insertion.',
    };

    const candidates: CandidateQuestionInput[] = [
      { id: 'q-1', content: 'explain the working of binary search tree insertion.' },
      { id: 'q-2', content: 'What is a B-Tree index in SQL?' },
    ];

    const result = await DuplicateDetectionService.evaluateQuestionDuplicates(target, candidates);

    expect(result.isDuplicate).toBe(true);
    expect(result.tier).toBe('EXACT_HASH');
    expect(result.confidence).toBe(1.0);
    expect(result.candidate?.questionId).toBe('q-1');
  });

  // ── Stage 2: Lexical BM25 / N-Gram Overlap Tests ─────────────────────────
  it('Stage 2: Detects lexical near-duplicates with high term overlap', () => {
    const targetText = 'Calculate the worst case execution time of merge sort algorithm.';
    const cand = { id: 'cand-lex', content: 'Compute the worst case execution time for merge sort algorithm.' };

    const lexical = DuplicateDetectionService.checkLexicalSimilarity(targetText, cand);

    expect(lexical.score).toBeGreaterThanOrEqual(0.70);
    expect(lexical.matchedTerms).toContain('worst');
    expect(lexical.matchedTerms).toContain('case');
    expect(lexical.matchedTerms).toContain('execution');
    expect(lexical.matchedTerms).toContain('merge');
    expect(lexical.matchedTerms).toContain('sort');
  });

  // ── Stage 3: Cosine Embedding Similarity Tests ───────────────────────────
  it('Stage 3: Identifies high semantic similarity between reworded questions', async () => {
    const target: CandidateQuestionInput = {
      id: 'q-sem-1',
      content: 'Explain binary search algorithm efficiency.',
    };

    const candidates: CandidateQuestionInput[] = [
      { id: 'q-sem-2', content: 'Describe divide and conquer search performance.' },
    ];

    const result = await DuplicateDetectionService.evaluateQuestionDuplicates(target, candidates);

    expect(result.isDuplicate).toBe(true);
    expect(result.tier).toBe('SEMANTIC');
    expect(result.confidence).toBeGreaterThanOrEqual(0.80);
  });

  // ── Stage 4: Answer Pattern Analysis Tests ────────────────────────────────
  it('Stage 4: Evaluates MCQ option structure and correct answer alignment', () => {
    const targetOpts = ['A. O(1)', 'B. O(log n)', 'C. O(n)', 'D. O(n^2)'];
    const candOpts = ['A. O(1) constant', 'B. O(log n) logarithmic', 'C. O(n) linear', 'D. O(n^2) quadratic'];

    const pattern = DuplicateDetectionService.checkAnswerPattern(targetOpts, 'B', candOpts, 'B');

    expect(pattern.matched).toBe(true);
    expect(pattern.score).toBeGreaterThanOrEqual(0.75);
    expect(pattern.details).toContain('Answer Key: Identical');
  });

  it('Stage 4: Does not flag duplicate solely on answer key match if question intent differs', async () => {
    const target: CandidateQuestionInput = {
      id: 'q-diff-1',
      content: 'What is the capital of France?',
      options: ['A. Paris', 'B. London', 'C. Berlin', 'D. Madrid'],
      answer: 'A',
    };

    const candidates: CandidateQuestionInput[] = [
      {
        id: 'q-diff-2',
        content: 'Which planet is known as the Red Planet?',
        options: ['A. Mars', 'B. Venus', 'C. Jupiter', 'D. Saturn'],
        answer: 'A',
      },
    ];

    const result = await DuplicateDetectionService.evaluateQuestionDuplicates(target, candidates);

    expect(result.isDuplicate).toBe(false);
    expect(result.tier).toBe('NONE');
  });

  // ── Pre-Insertion Batch Deduplication Tests ──────────────────────────────
  it('deduplicates questions within a generated batch before database insertion', async () => {
    const generatedBatch: CandidateQuestionInput[] = [
      { id: 'g-1', content: 'What is the speed of light in vacuum?', options: ['A. 3x10^8 m/s'], answer: 'A' },
      { id: 'g-2', content: 'what is the speed of light in vacuum?', options: ['A. 3x10^8 m/s'], answer: 'A' }, // Exact dup of g-1
      { id: 'g-3', content: 'Explain Newton second law of motion.', options: ['A. F=ma'], answer: 'A' },
    ];

    const batchResult = await DuplicateDetectionService.deduplicateBatch(generatedBatch);

    expect(batchResult.stats.total).toBe(3);
    expect(batchResult.stats.acceptedCount).toBe(2);
    expect(batchResult.stats.duplicateCount).toBe(1);
    expect(batchResult.accepted.map((a) => a.id)).toEqual(['g-1', 'g-3']);
  });
});
