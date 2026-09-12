import { z } from 'zod';

const questionTypeSchema = z.enum([
  'short-answer',
  'long-answer',
  'mcq',
  'true-false',
  'fill-blank',
]);

const difficultySchema = z.object({
  easy: z.number().int().min(0).max(100),
  medium: z.number().int().min(0).max(100),
  hard: z.number().int().min(0).max(100),
}).refine(
  (d) => d.easy + d.medium + d.hard === 100,
  { message: 'Difficulty percentages must sum to 100%' }
);

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(100),
  description: z.string().max(2000),
  dueDate: z.string().min(1, 'Due date is required'),
  duration: z
    .number({ invalid_type_error: 'Duration must be a number' })
    .int()
    .min(1, 'Minimum 1 minute')
    .max(600, 'Maximum 10 hours'),
  totalMarks: z
    .number({ invalid_type_error: 'Total marks must be a number' })
    .int()
    .min(1, 'Minimum 1 mark')
    .max(1000),
  questionConfig: z.object({
    types: z.array(questionTypeSchema).min(1, 'Select at least one question type'),
    count: z.number().int().min(1, 'Minimum 1 question').max(100),
    difficulty: difficultySchema,
  }),
  additionalInstructions: z.string().max(2000),
  typeBreakdown: z.string().optional(),
});

export type CreateAssignmentFormValues = z.infer<typeof createAssignmentSchema>;
