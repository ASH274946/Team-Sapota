import { z } from 'zod';

export const questionTypeSchema = z.enum([
  'short-answer',
  'long-answer',
  'mcq',
  'true-false',
  'fill-blank',
]);

export const difficultyDistributionSchema = z.object({
  easy: z.number().int().min(0).max(100),
  medium: z.number().int().min(0).max(100),
  hard: z.number().int().min(0).max(100),
}).refine(
  (data) => data.easy + data.medium + data.hard === 100,
  { message: 'Difficulty percentages must sum to 100' }
);

export const questionConfigSchema = z.object({
  types: z.array(questionTypeSchema).min(1, 'Select at least one question type'),
  count: z.number().int().min(1).max(100),
  difficulty: difficultyDistributionSchema,
});

export const createAssignmentSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  subject: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional().default(''),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  duration: z.number().int().min(1).max(600),
  totalMarks: z.number().int().min(1).max(1000),
  questionConfig: questionConfigSchema,
  additionalInstructions: z.string().max(2000).optional().default(''),
  typeBreakdown: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
