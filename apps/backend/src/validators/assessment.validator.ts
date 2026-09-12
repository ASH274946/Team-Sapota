import { z } from 'zod';

export const createAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    subject: z.string().min(2, 'Subject must be at least 2 characters'),
    totalMarks: z.number().int().positive(),
    questions: z.array(z.string().uuid('Invalid question ID')).min(1, 'Assessment must contain at least one question')
  })
});

export const getAssessmentsSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    skip: z.string().regex(/^\d+$/).transform(Number).optional(),
    subject: z.string().optional()
  })
});
