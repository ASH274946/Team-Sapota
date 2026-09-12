import { randomUUID } from 'crypto';
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';
import type { QuestionType } from '../../types/assignment.types';
import { validateSingleQuestion } from '../../validators/per-question-validator';

const answerSchema = z.object({
  text: z.string().min(1),
  explanation: z.string().optional(),
}).strict();

const mcqOptionSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
}).strict();

const baseQuestionSchema = z.object({
  question: z.string().min(5),
  type: z.enum(['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().min(1),
  answer: answerSchema.optional(),
}).strict();

const mcqQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('mcq'),
  options: z.array(mcqOptionSchema).length(4),
}).strict();

const trueFalseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('true-false'),
}).strict();

const fillBlankQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('fill-blank'),
  blanks: z.number().int().min(1),
}).strict();

const shortAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('short-answer'),
}).strict();

const longAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('long-answer'),
}).strict();

const rawQuestionSchema = z.discriminatedUnion('type', [
  mcqQuestionSchema,
  trueFalseQuestionSchema,
  fillBlankQuestionSchema,
  shortAnswerQuestionSchema,
  longAnswerQuestionSchema,
]);

export interface BatchQuestion {
  id: string;
  question: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options?: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
  blanks?: number;
  answer?: { text: string; explanation?: string };
}

export interface BatchValidationContext {
  batchId: string;
  expectedCount: number;
  expectedMarks: number;
  allowedTypes: QuestionType[];
  allowedMarks?: number[];
  expectedType?: QuestionType;
}

export interface BatchValidationResult {
  status: 'complete' | 'partial' | 'failed';
  ok: boolean;
  questions: BatchQuestion[];
  generatedCount: number;
  generatedMarks: number;
  completionRate: number;
  diagnostics: string[];
  repairCount: number;
  discardCount: number;
  totalDetected: number;
  malformedNodeCount: number;
  repairTypes: string[];
  salvageRate: number;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isLikelyTruncated(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (trimmed.endsWith(',')) return true;
  if (trimmed.endsWith(':')) return true;
  if (trimmed.endsWith('{') || trimmed.endsWith('[')) return true;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (const ch of trimmed) {
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
  }
  if (inString || depth !== 0) return true;
  return false;
}

function sanitize(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseAiJson(rawOutput: string): { value: unknown; repaired: boolean } {
  const cleaned = sanitize(rawOutput);
  if (isLikelyTruncated(cleaned)) {
    throw new Error('AI output appears truncated');
  }

  const repaired = jsonrepair(cleaned);
  const parsed = JSON.parse(repaired) as unknown;
  return { value: parsed, repaired: repaired !== cleaned };
}

function extractCandidateQuestions(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed !== 'object' || parsed === null) return [];

  const record = parsed as Record<string, unknown>;
  if (Array.isArray(record.questions)) return record.questions;
  if ('question' in record && 'type' in record) return [record];
  return [];
}

function normalizeQuestion(question: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {
    ...question,
    id: randomUUID(),
    question: typeof question.question === 'string' ? question.question.trim() : question.question,
  };

  if (normalized.type === 'mcq' && Array.isArray(normalized.options)) {
    normalized.options = (normalized.options as Array<Record<string, unknown>>).map((option, index) => ({
      key: ['A', 'B', 'C', 'D'][index] ?? option.key,
      text: typeof option.text === 'string' ? option.text.trim() : option.text,
    }));
  }

  if (normalized.type !== 'fill-blank') {
    delete normalized.blanks;
  }

  return normalized;
}

export function validateBatchResponse(
  rawOutput: string,
  context: BatchValidationContext
): BatchValidationResult {
  const diagnostics: string[] = [];

  let parsed: unknown;
  let repaired = false;

  try {
    ({ value: parsed, repaired } = parseAiJson(rawOutput));
  } catch (error) {
    diagnostics.push(error instanceof Error ? error.message : String(error));
    return {
      status: 'failed',
      ok: false,
      questions: [],
      generatedCount: 0,
      generatedMarks: 0,
      completionRate: 0,
      diagnostics,
      repairCount: 0,
      discardCount: 0,
      totalDetected: 0,
      malformedNodeCount: 1,
      repairTypes: [],
      salvageRate: 0,
    };
  }

  const candidates = extractCandidateQuestions(parsed);
  if (candidates.length === 0) {
    diagnostics.push(`Batch ${context.batchId}: no question objects found in output`);
    return {
      status: 'failed',
      ok: false,
      questions: [],
      generatedCount: 0,
      generatedMarks: 0,
      completionRate: 0,
      diagnostics,
      repairCount: 0,
      discardCount: 0,
      totalDetected: 0,
      malformedNodeCount: repaired ? 1 : 0,
      repairTypes: repaired ? ['jsonrepair'] : [],
      salvageRate: 0,
    };
  }

  if (context.expectedCount <= 0 || context.expectedMarks <= 0) {
    diagnostics.push(`Batch ${context.batchId}: invalid expected count or marks`);
    return {
      status: 'failed',
      ok: false,
      questions: [],
      generatedCount: 0,
      generatedMarks: 0,
      completionRate: 0,
      diagnostics,
      repairCount: 0,
      discardCount: candidates.length,
      totalDetected: candidates.length,
      malformedNodeCount: repaired ? 1 : 0,
      repairTypes: repaired ? ['jsonrepair'] : [],
      salvageRate: 0,
    };
  }

  const allowedTypes = new Set(context.allowedTypes);
  const allowedMarks = new Set((context.allowedMarks && context.allowedMarks.length > 0 ? context.allowedMarks : [Math.round(context.expectedMarks / Math.max(1, context.expectedCount))]).map((value) => Math.max(1, Math.round(value))));
  const seenQuestions = new Set<string>();
  const normalizedQuestions: BatchQuestion[] = [];
  let discardCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      diagnostics.push(`Question ${i + 1}: not an object`);
      discardCount++;
      continue;
    }

    const rawQuestion = normalizeQuestion(candidate as Record<string, unknown>);

    if (context.expectedType && rawQuestion.type !== context.expectedType) {
      diagnostics.push(`Question ${i + 1}: expected type ${context.expectedType}, got ${String(rawQuestion.type)}`);
      discardCount++;
      continue;
    }

    if (!allowedTypes.has(String(rawQuestion.type) as QuestionType)) {
      diagnostics.push(`Question ${i + 1}: type ${String(rawQuestion.type)} is not allowed in this batch`);
      discardCount++;
      continue;
    }

    if (!allowedMarks.has(Math.max(1, Math.round(Number(rawQuestion.marks) || 0)))) {
      diagnostics.push(`Question ${i + 1}: marks ${String(rawQuestion.marks)} are not allowed in this batch`);
      discardCount++;
      continue;
    }

    const validation = validateSingleQuestion(rawQuestion, i);
    if (!validation.valid) {
      diagnostics.push(...validation.errors.map((message) => `Question ${i + 1}: ${message}`));
      discardCount++;
      continue;
    }

    const normalizedText = normalizeText(String(rawQuestion.question ?? ''));
    if (seenQuestions.has(normalizedText)) {
      diagnostics.push(`Question ${i + 1}: duplicate question text detected`);
      discardCount++;
      continue;
    }

    seenQuestions.add(normalizedText);

    const schemaQuestion = { ...rawQuestion } as Record<string, unknown>;
    delete schemaQuestion.id;

    const parsedQuestion = rawQuestionSchema.safeParse(schemaQuestion);
    if (!parsedQuestion.success) {
      diagnostics.push(`Question ${i + 1}: schema validation failed`);
      discardCount++;
      continue;
    }

    const questionWithId = {
      ...(parsedQuestion.data as Omit<BatchQuestion, 'id'>),
      id: randomUUID(),
    } satisfies BatchQuestion;

    normalizedQuestions.push(questionWithId);
  }

  const generatedCount = normalizedQuestions.length;
  const generatedMarks = normalizedQuestions.reduce((sum, q) => sum + q.marks, 0);
  const completionRate = context.expectedCount > 0 ? generatedCount / context.expectedCount : 0;
  const salvageRate = candidates.length > 0 ? generatedCount / candidates.length : 0;
  const totalDetected = candidates.length;
  const malformedNodeCount = repaired ? 1 : 0;
  const repairTypes = repaired ? ['jsonrepair'] : [];

  const ok =
    generatedCount === context.expectedCount &&
    generatedMarks === context.expectedMarks &&
    malformedNodeCount === 0 &&
    discardCount === 0;

  const status: BatchValidationResult['status'] = ok
    ? 'complete'
    : generatedCount > 0
    ? 'partial'
    : 'failed';

  if (generatedCount === 0) {
    diagnostics.push(
      `Batch ${context.batchId} rejected: generatedQuestions=${generatedCount}, expectedQuestions=${context.expectedCount}, generatedMarks=${generatedMarks}, expectedMarks=${context.expectedMarks}, discarded=${discardCount}, malformed=${malformedNodeCount}`
    );
    return {
      status: 'failed',
      ok: false,
      questions: [],
      generatedCount,
      generatedMarks,
      completionRate,
      diagnostics,
      repairCount: 0,
      discardCount,
      totalDetected,
      malformedNodeCount,
      repairTypes,
      salvageRate,
    };
  }

  return {
    status,
    ok,
    questions: normalizedQuestions,
    generatedCount,
    generatedMarks,
    completionRate,
    diagnostics,
    repairCount: 0,
    discardCount,
    totalDetected,
    malformedNodeCount,
    repairTypes,
    salvageRate,
  };
}
