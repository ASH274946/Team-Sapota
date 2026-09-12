import { z } from 'zod';

export const assistSchema = z.object({
  body: z.object({
    query: z.string().min(1).max(5000),
    context: z.string().optional(),
    subject: z.string().optional(),
  }),
});

export const generateLessonPlanSchema = z.object({
  body: z.object({
    subject: z.string().min(1).max(200),
    topic: z.string().min(1).max(500),
    duration: z.string(),
    learningOutcomes: z.array(z.string()).min(1).max(20),
  }),
});

export const generateActivitySchema = z.object({
  body: z.object({
    subject: z.string().min(1).max(200),
    topic: z.string().min(1).max(500),
    duration: z.string().optional().default('30 minutes'),
    groupSize: z.number().int().min(1).max(50).optional().default(4),
    objectives: z.array(z.string()).optional(),
  }),
});

export const generateWorksheetSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    subject: z.string().min(1).max(200),
    topic: z.string().min(1).max(500),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  }),
});

export const feedbackSchema = z.object({
  body: z.object({
    historyId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});
