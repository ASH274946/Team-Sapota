import type { QuestionType } from '../../types/assignment.types';

export interface RetryContext {
  provider: string;
  correlationId: string;
  maxAttempts: number;
}

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
  reason: string;
}

export function buildAdaptiveRetryPrompt(originalPrompt: string, failureReason: string): string {
  return `${originalPrompt}\n\nYour previous response failed validation (${failureReason}).\nHard requirements:\n1) Return EXACTLY the requested number of questions (NO MORE, NO LESS).\n2) Return marks that sum EXACTLY to the requested total marks.\n3) Preserve requested type quotas and section completeness.\n4) No placeholder text, no duplicate questions, no duplicate options.\n5) Output ONLY strict valid JSON. No markdown, no prose, no code fences.`;
}

export interface SmartRetryInput {
  missingCount: number;
  missingTypes: QuestionType[];
  marksPerQuestion: number;
  allowedMarks: number[];
  difficultyHint: string;
  syllabusContext: string;
  sectionTitle: string;
}

export function buildSmartRetryPrompt(input: SmartRetryInput): string {
  const allowedTypes = input.missingTypes.join(', ');
  const allowedMarks = input.allowedMarks.join(', ');

  return (
    `Generate EXACTLY ${input.missingCount} additional question(s) for an exam paper.\n\n` +
    `Requirements:\n` +
    `- Question type(s): ${allowedTypes}\n` +
    `- Allowed marks per question: ${allowedMarks}\n` +
    `- Marks per question: ${input.marksPerQuestion}\n` +
    `- Total marks needed: ${input.missingCount * input.marksPerQuestion}\n` +
    `- Difficulty: ${input.difficultyHint}\n` +
    `- Section: ${input.sectionTitle}\n\n` +
    `${input.syllabusContext ? 'Topic context: ' + input.syllabusContext.slice(0, 500) + '\n\n' : ''}` +
    `Return ONLY valid JSON with a "questions" array containing EXACTLY ${input.missingCount} question object(s).\n` +
    `No markdown, no code fences, no extra text.\n` +
    `Do NOT include an id field. The server assigns question IDs internally.\n` +
    `Each object must have: question (string, >=10 chars), type, difficulty, marks.\n` +
    `For MCQ: include exactly 4 options with key and text.\n` +
    `Question marks must match one of the allowed marks exactly.`
  );
}

export function retryDecision(attempt: number, context: RetryContext, retryable: boolean): RetryDecision {
  if (!retryable) {
    return { shouldRetry: false, delayMs: 0, reason: 'not_retryable' };
  }
  if (attempt >= context.maxAttempts) {
    return { shouldRetry: false, delayMs: 0, reason: 'attempt_limit_reached' };
  }
  const delayMs = Math.min(1500 * attempt, 5000) + Math.floor(Math.random() * 500);
  return { shouldRetry: true, delayMs, reason: 'retryable_error' };
}
