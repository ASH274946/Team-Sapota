import { z } from 'zod';
import { randomUUID } from 'crypto';

const answerSchema = z.object({
  text: z.string().default(''),
  explanation: z.string().optional(),
}).passthrough();

const mcqOptionSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().default(''),
}).passthrough();

const baseQuestionSchema = z.object({
  id: z.string().default(() => randomUUID()),
  question: z.string().min(1),
  type: z.enum(['short-answer', 'long-answer', 'mcq', 'true-false', 'fill-blank']).default('short-answer'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  marks: z.number().default(1),
  answer: answerSchema.optional(),
  bloomLevel: z.string().optional(),
  hint: z.string().optional(),
}).passthrough();

const mcqQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('mcq'),
  options: z.array(mcqOptionSchema).default([]),
}).passthrough();

const trueFalseQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('true-false'),
}).passthrough();

const fillBlankQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('fill-blank'),
  blanks: z.number().int().min(1).default(1),
}).passthrough();

const shortAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('short-answer'),
}).passthrough();

const longAnswerQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('long-answer'),
}).passthrough();

export const questionSchema = z.discriminatedUnion('type', [
  mcqQuestionSchema,
  trueFalseQuestionSchema,
  fillBlankQuestionSchema,
  shortAnswerQuestionSchema,
  longAnswerQuestionSchema,
]);

const sectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().optional().default(''),
  instructions: z.string().optional(),
  marks: z.number().optional(),
  questions: z.array(questionSchema).min(1),
}).passthrough();

export const generatedPaperSchema = z.object({
  title: z.string().min(1),
  totalMarks: z.number().int().min(1),
  sections: z.array(sectionSchema).min(1),
}).passthrough();

export type ValidatedPaper = z.infer<typeof generatedPaperSchema>;

export function validatePaperOrThrow(paper: unknown): ValidatedPaper {
  const result = generatedPaperSchema.safeParse(paper);
  if (!result.success) {
    throw new Error(`Invalid paper schema: ${result.error.message}`);
  }
  return result.data;
}
