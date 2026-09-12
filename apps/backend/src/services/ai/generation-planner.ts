import type { IAssignment } from '../../types/models.types';
import type { QuestionType } from '../../types/assignment.types';
import type { QuestionTypeBreakdown } from '../../prompts/generation.prompt';

export interface PlannedBatch {
  id: string;
  type: QuestionType;
  displayType?: string;
  count: number;
  marksPerQuestion: number;
  totalMarks: number;
  allowedTypes: QuestionType[];
  sectionTitle: string;
  difficultyHint: 'easy' | 'medium' | 'hard';
}

export interface GenerationPlan {
  batches: PlannedBatch[];
  totalQuestions: number;
  totalMarks: number;
  maxBatchQuestions: number;
}

const DEFAULT_MAX_BATCH_QUESTIONS = 4;

function normalizeDifficultyHint(value: number): 'easy' | 'medium' | 'hard' {
  if (value >= 0.6) return 'hard';
  if (value >= 0.33) return 'medium';
  return 'easy';
}

function splitTypeBreakdown(
  typeBreakdown: QuestionTypeBreakdown[],
  difficultyHint: 'easy' | 'medium' | 'hard',
  maxBatchQuestions: number
): PlannedBatch[] {
  const batches: PlannedBatch[] = [];

  for (const bucket of typeBreakdown) {
    let remaining = bucket.count;
    let index = 1;
    while (remaining > 0) {
      const count = Math.min(maxBatchQuestions, remaining);
      batches.push({
        id: `${bucket.type}-${index}`,
        type: bucket.type as QuestionType,
        displayType: bucket.displayType,
        count,
        marksPerQuestion: bucket.marksPerQuestion,
        totalMarks: count * bucket.marksPerQuestion,
        allowedTypes: [bucket.type as QuestionType],
        sectionTitle: bucket.displayType || bucket.type,
        difficultyHint,
      });
      remaining -= count;
      index += 1;
    }
  }

  return batches;
}

function buildFallbackBatches(assignment: IAssignment, maxBatchQuestions: number): PlannedBatch[] {
  const batches: PlannedBatch[] = [];
  const types = assignment.questionConfig.types;
  const totalQuestions = assignment.questionConfig.count;
  const marksPerQuestion = Math.max(1, Math.floor(assignment.totalMarks / totalQuestions));
  const difficultyRatio = assignment.questionConfig.difficulty.easy / 100;
  const difficultyHint = normalizeDifficultyHint(difficultyRatio);

  let remaining = totalQuestions;
  let index = 1;
  while (remaining > 0) {
    const count = Math.min(maxBatchQuestions, remaining);
    batches.push({
      id: `mixed-${index}`,
      type: (types[0] ?? 'short-answer') as any,
      count,
      marksPerQuestion,
      totalMarks: count * marksPerQuestion,
      allowedTypes: types as any,
      sectionTitle: types.join(', '),
      difficultyHint,
    });
    remaining -= count;
    index += 1;
  }

  return batches;
}

export function createGenerationPlan(
  assignment: IAssignment,
  typeBreakdown?: QuestionTypeBreakdown[],
  options?: { maxBatchQuestions?: number }
): GenerationPlan {
  const difficultyRatio = assignment.questionConfig.difficulty.easy / 100;
  const difficultyHint = normalizeDifficultyHint(difficultyRatio);
  const maxBatchQuestions = Math.max(1, Math.min(8, options?.maxBatchQuestions ?? DEFAULT_MAX_BATCH_QUESTIONS));
  const batches = typeBreakdown && typeBreakdown.length > 0
    ? splitTypeBreakdown(typeBreakdown, difficultyHint, maxBatchQuestions)
    : buildFallbackBatches(assignment, maxBatchQuestions);

  return {
    batches,
    totalQuestions: assignment.questionConfig.count,
    totalMarks: assignment.totalMarks,
    maxBatchQuestions,
  };
}
