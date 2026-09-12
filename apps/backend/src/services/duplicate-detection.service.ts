import crypto from 'crypto';
import prisma from '../config/prisma';
import { logger } from '../utils/logger';
import { getEmbedding } from './rag/vector-search.service';

export type DuplicateTier = 'EXACT_HASH' | 'LEXICAL' | 'SEMANTIC' | 'ANSWER_PATTERN' | 'NONE';

export interface DuplicateEvidence {
  exact?: { matched: boolean; hash: string };
  lexical?: { score: number; matchedTerms: string[]; excerpt?: string };
  semantic?: { similarity: number; vectorDistance: number };
  answerPattern?: { matched: boolean; score: number; details?: string };
}

export interface CandidateQuestionInput {
  id?: string;
  content: string;
  options?: string[] | any;
  answer?: string;
  difficulty?: string;
  bloomLevel?: string;
  subjectId?: string;
  organizationId?: string;
}

export interface DuplicateCandidateMatch {
  questionId: string;
  questionText: string;
  options?: string[];
  answer?: string;
  similarity: number;
  confidence: number;
  tier: DuplicateTier;
  evidence: DuplicateEvidence;
  matchedExcerpt?: string;
}

export interface DuplicateDetectionResult {
  questionId?: string;
  questionText: string;
  isDuplicate: boolean;
  confidence: number;
  tier: DuplicateTier;
  candidate?: DuplicateCandidateMatch;
  allCandidates: DuplicateCandidateMatch[];
}

export interface BatchDeduplicationResult<T = CandidateQuestionInput> {
  accepted: T[];
  duplicates: Array<{ item: T; result: DuplicateDetectionResult }>;
  stats: {
    total: number;
    acceptedCount: number;
    duplicateCount: number;
  };
}

// ── Common English Stopwords for Lexical Matching ────────────────────────────
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'from',
  'up', 'down', 'of', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's',
  't', 'can', 'will', 'just', 'don', 'should', 'now', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'it', 'its',
]);

export class DuplicateDetectionService {
  /**
   * Stage 1: Deterministic Text Normalization
   * Trims, lowercases, collapses whitespace, applies NFC Unicode normalization,
   * while preserving mathematical and code operators (+, -, *, /, =, <, >, %).
   */
  static normalizeText(text: string): string {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      .normalize('NFC')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s+*/=<>%-]/g, '');
  }

  /**
   * Computes SHA-256 hash of normalized question text.
   */
  static computeExactHash(text: string): string {
    const normalized = this.normalizeText(text);
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Stage 1 Check: Exact Hash Match
   */
  static checkExactHash(
    targetText: string,
    candidates: Array<{ id: string; content: string }>
  ): DuplicateCandidateMatch | null {
    const targetHash = this.computeExactHash(targetText);
    const targetNormalized = this.normalizeText(targetText);

    for (const cand of candidates) {
      const candNormalized = this.normalizeText(cand.content);
      const candHash = this.computeExactHash(cand.content);

      if (targetHash === candHash || targetNormalized === candNormalized) {
        return {
          questionId: cand.id,
          questionText: cand.content,
          similarity: 1.0,
          confidence: 1.0,
          tier: 'EXACT_HASH',
          evidence: {
            exact: { matched: true, hash: targetHash },
          },
          matchedExcerpt: cand.content,
        };
      }
    }

    return null;
  }

  /**
   * Stage 2 Check: Lexical BM25 / N-Gram Overlap
   */
  static checkLexicalSimilarity(
    targetText: string,
    candidate: { id: string; content: string }
  ): { score: number; matchedTerms: string[]; excerpt?: string } {
    const targetTokens = this.normalizeText(targetText)
      .split(' ')
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

    const candTokens = this.normalizeText(candidate.content)
      .split(' ')
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

    if (targetTokens.length === 0 || candTokens.length === 0) {
      return { score: 0, matchedTerms: [] };
    }

    const candTokenSet = new Set(candTokens);
    const matchedTerms = Array.from(new Set(targetTokens.filter((t) => candTokenSet.has(t))));

    // Calculate Jaccard similarity & term overlap ratio
    const unionSize = new Set([...targetTokens, ...candTokens]).size;
    const jaccard = unionSize > 0 ? matchedTerms.length / unionSize : 0;
    const overlapRatio = matchedTerms.length / Math.min(targetTokens.length, candTokens.length);

    // Combined lexical score
    const lexicalScore = parseFloat((jaccard * 0.4 + overlapRatio * 0.6).toFixed(3));

    let excerpt: string | undefined;
    if (matchedTerms.length > 0) {
      excerpt = `Matching terms: [${matchedTerms.slice(0, 8).join(', ')}]`;
    }

    return {
      score: lexicalScore,
      matchedTerms,
      excerpt,
    };
  }

  /**
   * Computes Cosine Similarity between two vector arrays.
   */
  static computeCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return parseFloat(Math.max(0, Math.min(1, similarity)).toFixed(3));
  }

  /**
   * Stage 4 Check: Answer Pattern Analysis
   */
  static checkAnswerPattern(
    targetOptions: string[] | undefined,
    targetAnswer: string | undefined,
    candidateOptions: string[] | undefined,
    candidateAnswer: string | undefined
  ): { matched: boolean; score: number; details: string } {
    if (!targetOptions || !candidateOptions || targetOptions.length === 0 || candidateOptions.length === 0) {
      return { matched: false, score: 0, details: 'Insufficient options to compare answer pattern' };
    }

    // Compare options text similarity
    const normTargetOpts = targetOptions.map((o) => this.normalizeText(o));
    const normCandOpts = candidateOptions.map((o) => this.normalizeText(o));

    let matchingOptsCount = 0;
    for (const tOpt of normTargetOpts) {
      if (normCandOpts.some((cOpt) => cOpt === tOpt || (tOpt.length >= 3 && (cOpt.includes(tOpt) || tOpt.includes(cOpt))))) {
        matchingOptsCount++;
      }
    }

    const optionsScore = matchingOptsCount / Math.max(normTargetOpts.length, normCandOpts.length);
    const answerKeyMatch = targetAnswer && candidateAnswer && targetAnswer.trim().toLowerCase() === candidateAnswer.trim().toLowerCase();

    // Answer pattern score combines option overlap and correct answer alignment
    const combinedScore = parseFloat((optionsScore * 0.7 + (answerKeyMatch ? 0.3 : 0)).toFixed(3));
    const matched = combinedScore >= 0.75;

    return {
      matched,
      score: combinedScore,
      details: `${matchingOptsCount}/${normTargetOpts.length} options match, Answer Key: ${answerKeyMatch ? 'Identical' : 'Different'}`,
    };
  }

  /**
   * Evaluates a target question against candidates through the complete 4-stage pipeline.
   */
  static async evaluateQuestionDuplicates(
    target: CandidateQuestionInput,
    candidates: CandidateQuestionInput[],
    _organizationId?: string
  ): Promise<DuplicateDetectionResult> {
    const allCandidates: DuplicateCandidateMatch[] = [];

    // Stage 1: Exact Hash Check (Short-circuit if match found)
    const exactMatch = this.checkExactHash(
      target.content,
      candidates.map((c) => ({ id: c.id || 'cand-0', content: c.content }))
    );

    if (exactMatch) {
      const fullCand = candidates.find((c) => c.id === exactMatch.questionId);
      exactMatch.options = Array.isArray(fullCand?.options) ? fullCand.options : undefined;
      exactMatch.answer = fullCand?.answer;

      return {
        questionId: target.id,
        questionText: target.content,
        isDuplicate: true,
        confidence: 1.0,
        tier: 'EXACT_HASH',
        candidate: exactMatch,
        allCandidates: [exactMatch],
      };
    }

    // Stage 3 Vector Embedding Prep (Compute target vector once for batch optimization)
    let targetVector: number[] | null = null;
    try {
      targetVector = await getEmbedding(target.content);
    } catch (err) {
      logger.warn(`[DuplicateDetection] Failed to fetch OpenAI embedding: ${err}`);
    }

    // Evaluate remaining candidates through Stage 2 (Lexical), Stage 3 (Semantic), and Stage 4 (Answer Pattern)
    for (const cand of candidates) {
      if (cand.id && target.id && cand.id === target.id) continue; // Skip self

      // Stage 2: Lexical BM25
      const lexical = this.checkLexicalSimilarity(target.content, { id: cand.id || 'cand-x', content: cand.content });

      // Stage 3: Cosine Embedding Similarity
      let semanticSim = 0;
      if (targetVector) {
        try {
          const candVector = await getEmbedding(cand.content);
          if (candVector) {
            semanticSim = this.computeCosineSimilarity(targetVector, candVector);
          }
        } catch { /* empty */ }
      }

      // Stage 4: Answer Pattern Analysis
      const targetOpts = Array.isArray(target.options) ? target.options : undefined;
      const candOpts = Array.isArray(cand.options) ? cand.options : undefined;
      const answerPattern = this.checkAnswerPattern(targetOpts, target.answer, candOpts, cand.answer);

      // ── Decision Threshold Rules ──
      let tier: DuplicateTier = 'NONE';
      let confidence = 0;
      let isDup = false;

      if (lexical.score >= 0.85) {
        tier = 'LEXICAL';
        confidence = parseFloat(lexical.score.toFixed(2));
        isDup = true;
      } else if (semanticSim >= 0.82) {
        tier = 'SEMANTIC';
        confidence = parseFloat(semanticSim.toFixed(2));
        isDup = true;
      } else if (semanticSim >= 0.70 && answerPattern.matched) {
        // Combined evidence: Medium semantic similarity + high answer pattern overlap
        tier = 'ANSWER_PATTERN';
        confidence = parseFloat(((semanticSim + answerPattern.score) / 2).toFixed(2));
        isDup = true;
      }

      const matchScore = Math.max(lexical.score, semanticSim);

      if (matchScore >= 0.50 || isDup) {
        allCandidates.push({
          questionId: cand.id || 'cand-id',
          questionText: cand.content,
          options: Array.isArray(cand.options) ? cand.options : undefined,
          answer: cand.answer,
          similarity: matchScore,
          confidence,
          tier,
          evidence: {
            exact: { matched: false, hash: this.computeExactHash(target.content) },
            lexical: { score: lexical.score, matchedTerms: lexical.matchedTerms, excerpt: lexical.excerpt },
            semantic: { similarity: semanticSim, vectorDistance: parseFloat((1 - semanticSim).toFixed(3)) },
            answerPattern: { matched: answerPattern.matched, score: answerPattern.score, details: answerPattern.details },
          },
          matchedExcerpt: lexical.excerpt || `Semantic similarity: ${(semanticSim * 100).toFixed(0)}%`,
        });
      }
    }

    // Sort candidate matches by highest confidence / similarity descending
    allCandidates.sort((a, b) => b.confidence - a.confidence || b.similarity - a.similarity);

    const topCandidate = allCandidates.length > 0 && allCandidates[0].tier !== 'NONE' ? allCandidates[0] : undefined;

    return {
      questionId: target.id,
      questionText: target.content,
      isDuplicate: !!topCandidate,
      confidence: topCandidate ? topCandidate.confidence : 0,
      tier: topCandidate ? topCandidate.tier : 'NONE',
      candidate: topCandidate,
      allCandidates,
    };
  }

  /**
   * Pre-insertion Batch Deduplication Engine
   * Deduplicates a batch of generated questions against:
   * 1. Intra-batch duplicate candidates (new questions in current batch).
   * 2. Existing database question bank for the tenant/organization.
   */
  static async deduplicateBatch<T extends CandidateQuestionInput>(
    generatedQuestions: T[],
    organizationId?: string,
    subjectId?: string
  ): Promise<BatchDeduplicationResult<T>> {
    const accepted: T[] = [];
    const duplicates: Array<{ item: T; result: DuplicateDetectionResult }> = [];

    // 1. Retrieve existing candidate questions from database if organizationId is provided
    let dbCandidates: CandidateQuestionInput[] = [];
    if (organizationId) {
      try {
        const dbQuestions = await prisma.question.findMany({
          where: {
            organizationId,
            ...(subjectId && { subjectId }),
          },
          select: {
            id: true,
            content: true,
            options: true,
            answer: true,
            difficulty: true,
            bloomLevel: true,
          },
          take: 500, // Bounded retrieval to ensure <350ms performance
          orderBy: { createdAt: 'desc' },
        });

        dbCandidates = dbQuestions.map((q) => ({
          id: q.id,
          content: q.content,
          options: q.options as any,
          answer: q.answer || undefined,
          difficulty: q.difficulty,
          bloomLevel: q.bloomLevel,
        }));
      } catch (err) {
        logger.warn(`[DuplicateDetection] Failed to fetch DB questions for deduplication: ${err}`);
      }
    }

    // 2. Process generated batch sequentially against accepted items and DB candidates
    for (const item of generatedQuestions) {
      const currentCandidates = [...accepted, ...dbCandidates];
      const result = await this.evaluateQuestionDuplicates(item, currentCandidates, organizationId);

      if (result.isDuplicate) {
        duplicates.push({ item, result });
      } else {
        accepted.push(item);
      }
    }

    return {
      accepted,
      duplicates,
      stats: {
        total: generatedQuestions.length,
        acceptedCount: accepted.length,
        duplicateCount: duplicates.length,
      },
    };
  }
}
