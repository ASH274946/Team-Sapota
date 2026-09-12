import type { BloomLevel } from '@prisma/client';

export interface BloomClassificationResult {
  level: BloomLevel;
  confidence: number; // 0.0 to 1.0
  cues: {
    verbs: string[];
    operations: string[];
    responseType: string;
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  scores: Record<BloomLevel, number>;
  explanation: string;
}

export interface BloomTaxonomyConfig {
  version: string;
  customVerbs?: Record<string, BloomLevel>;
  levelWeights?: Record<BloomLevel, number>;
}

// ── Canonical Action Verbs ──────────────────────────────────────────────────
const BLOOM_VERBS: Record<BloomLevel, string[]> = {
  REMEMBER: [
    'define', 'list', 'state', 'identify', 'label', 'name', 'recall', 'repeat',
    'reproduce', 'match', 'memorize', 'select', 'quote', 'recite', 'recognize',
  ],
  UNDERSTAND: [
    'explain', 'describe', 'discuss', 'summarize', 'interpret', 'classify',
    'convert', 'paraphrase', 'distinguish', 'extend', 'illustrate', 'outline',
    'indicate', 'review', 'translate',
  ],
  APPLY: [
    'apply', 'calculate', 'compute', 'solve', 'implement', 'execute', 'demonstrate',
    'use', 'operate', 'construct', 'modify', 'prepare', 'produce', 'relate', 'show',
  ],
  ANALYZE: [
    'analyze', 'compare', 'contrast', 'differentiate', 'deconstruct', 'dissect',
    'categorize', 'separate', 'examine', 'question', 'inspect', 'investigate',
    'partition', 'breakdown', 'distinguish',
  ],
  EVALUATE: [
    'evaluate', 'critique', 'assess', 'judge', 'appraise', 'defend', 'justify',
    'argue', 'rate', 'benchmark', 'validate', 'verify', 'score', 'support',
  ],
  CREATE: [
    'design', 'develop', 'create', 'formulate', 'invent', 'compose', 'author',
    'construct', 'plan', 'devise', 'synthesize', 'generate', 'architect', 'build',
  ],
};

// ── Higher-Order Cognitive Operations (Overrides naive verb matches) ──────
const COGNITIVE_OPERATIONS: Array<{ pattern: RegExp; level: BloomLevel; operation: string }> = [
  { pattern: /\b(design|architect|develop|build|formulate|devise|invent)\s+a\b/i, level: 'CREATE', operation: 'System Design / Synthesis' },
  { pattern: /\b(create|construct|compose)\s+(a|an|new)\b/i, level: 'CREATE', operation: 'Product / Artifact Creation' },
  { pattern: /\b(evaluate|critique|judge)\s+(which|the|whether|trade-offs|alternatives)\b/i, level: 'EVALUATE', operation: 'Critical Evaluation & Justification' },
  { pattern: /\b(assess|validate|verify)\s+the\b/i, level: 'EVALUATE', operation: 'Validation & Assessment' },
  { pattern: /\b(compare|contrast|differentiate)\s+(the|between|and)\b/i, level: 'ANALYZE', operation: 'Comparative Analysis' },
  { pattern: /\b(analyze|deconstruct|dissect)\s+(the|how|why|cause|bottleneck)\b/i, level: 'ANALYZE', operation: 'Structural / Causal Breakdown' },
  { pattern: /\b(calculate|compute|solve)\s+the\b/i, level: 'APPLY', operation: 'Mathematical / Quantitative Solution' },
  { pattern: /\b(implement|execute)\s+(a|an|the|binary|algorithm)\b/i, level: 'APPLY', operation: 'Algorithmic Implementation' },
  { pattern: /\b(explain|describe|summarize)\s+(how|why|the|purpose|concept)\b/i, level: 'UNDERSTAND', operation: 'Conceptual Explanation' },
  { pattern: /\b(define|list|state|identify)\s+(the|all|what|three|four|layers)\b/i, level: 'REMEMBER', operation: 'Knowledge Recall' },
];

export class BloomClassifierService {
  /**
   * Classifies a question text against Bloom's Cognitive Taxonomy using a multi-cue engine.
   */
  static classify(text: string, config?: BloomTaxonomyConfig): BloomClassificationResult {
    const normalizedText = text.trim().toLowerCase();
    const words = normalizedText.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);

    // Initial score map
    const scores: Record<BloomLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    const detectedVerbs: string[] = [];
    const detectedOperations: string[] = [];

    // 1. Verb Cue Analysis
    const customVerbs = config?.customVerbs || {};
    for (const word of words) {
      if (customVerbs[word]) {
        const lvl = customVerbs[word];
        scores[lvl] += 3.0;
        detectedVerbs.push(`${word} (custom:${lvl})`);
        continue;
      }

      for (const [level, verbList] of Object.entries(BLOOM_VERBS) as [BloomLevel, string[]][]) {
        if (verbList.includes(word)) {
          scores[level] += 2.0;
          detectedVerbs.push(word);
        }
      }
    }

    // 2. Cognitive Operation Cue Analysis (Higher priority for ambiguous prompts)
    for (const op of COGNITIVE_OPERATIONS) {
      if (op.pattern.test(normalizedText)) {
        // Higher-order cognitive ops get a heavy weight boost
        scores[op.level] += 4.0;
        detectedOperations.push(op.operation);
      }
    }

    // 3. Expected Response Type Inference
    let responseType = 'Explanation';
    if (/\b(design|architecture|diagram|schema)\b/i.test(normalizedText)) {
      responseType = 'Design Artifact';
      scores.CREATE += 2.0;
    } else if (/\b(justify|critique|verdict|recommendation)\b/i.test(normalizedText)) {
      responseType = 'Justified Critique';
      scores.EVALUATE += 2.0;
    } else if (/\b(comparison|differences|table|matrix)\b/i.test(normalizedText)) {
      responseType = 'Comparative Matrix';
      scores.ANALYZE += 2.0;
    } else if (/\b(code|implementation|calculation|formula|solution)\b/i.test(normalizedText)) {
      responseType = 'Worked Solution';
      scores.APPLY += 2.0;
    } else if (/\b(definition|list|name)\b/i.test(normalizedText)) {
      responseType = 'Factual Recall';
      scores.REMEMBER += 1.5;
    }

    // 4. Structural Complexity Estimation
    let complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (words.length > 25 || /\b(furthermore|moreover|consequently|given that|assuming)\b/i.test(normalizedText)) {
      complexity = 'HIGH';
      // High complexity boosts upper taxonomy levels
      scores.ANALYZE += 1.0;
      scores.EVALUATE += 1.0;
      scores.CREATE += 1.0;
    } else if (words.length < 8) {
      complexity = 'LOW';
      scores.REMEMBER += 1.0;
    }

    // Apply taxonomy level weights from config if provided
    if (config?.levelWeights) {
      for (const lvl of Object.keys(scores) as BloomLevel[]) {
        if (config.levelWeights[lvl] !== undefined) {
          scores[lvl] *= config.levelWeights[lvl];
        }
      }
    }

    // 5. Rank candidate levels (with deterministic tie-breaking: CREATE > EVALUATE > ANALYZE > APPLY > UNDERSTAND > REMEMBER)
    const hierarchy: BloomLevel[] = ['CREATE', 'EVALUATE', 'ANALYZE', 'APPLY', 'UNDERSTAND', 'REMEMBER'];
    const sortedLevels = (Object.keys(scores) as BloomLevel[]).sort((a, b) => {
      const diff = scores[b] - scores[a];
      if (Math.abs(diff) > 0.001) return diff;
      return hierarchy.indexOf(a) - hierarchy.indexOf(b);
    });

    const topLevel = sortedLevels[0];
    const topScore = scores[topLevel];
    const runnerUpScore = scores[sortedLevels[1]] || 0;

    // 6. Deterministic Confidence Calculation (normalized 0.0 - 1.0)
    let confidence = 0.5; // baseline
    if (topScore > 0) {
      const margin = topScore - runnerUpScore;
      const cueStrength = Math.min(1.0, topScore / 8.0);
      confidence = Math.min(0.98, Math.max(0.45, 0.4 + (margin * 0.15) + (cueStrength * 0.3)));
    } else {
      // Default fallback if no keywords matched
      confidence = 0.5;
    }

    // Build structured explanation
    const uniqueVerbs = Array.from(new Set(detectedVerbs));
    const verbPhrase = uniqueVerbs.length > 0 ? `verbs [${uniqueVerbs.join(', ')}]` : 'no explicit action verbs';
    const opPhrase = detectedOperations.length > 0 ? `operation [${detectedOperations.join(', ')}]` : 'standard structure';
    const explanation = `Classified as ${topLevel} (${(confidence * 100).toFixed(0)}% confidence) based on ${verbPhrase}, ${opPhrase}, and expected response '${responseType}'.`;

    return {
      level: topLevel,
      confidence: parseFloat(confidence.toFixed(2)),
      cues: {
        verbs: uniqueVerbs,
        operations: detectedOperations,
        responseType,
        complexity,
      },
      scores,
      explanation,
    };
  }
}
