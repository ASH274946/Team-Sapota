import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const sharedIdParamSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const generateQuizSchema = z.object({
  body: z.object({
    topic: z.string().min(1),
    subject: z.string().min(1),
    difficulty: z.string(),
    bloomLevel: z.string().optional(),
    count: z.number().int().min(1).max(50).default(5),
    organizationId: z.string().uuid().optional(),
  }),
});

export const createQuizSessionSchema = z.object({
  body: z.object({
    topic: z.string().min(1),
    subject: z.string().min(1),
    difficulty: z.string(),
    organizationId: z.string().uuid().optional(),
    totalQuestions: z.number().int().min(1).max(100).optional().default(10),
  }),
});

export const updateQuizSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    score: z.number().min(0).optional(),
    timeSpent: z.number().min(0).optional(),
    attempts: z.number().int().min(0).optional(),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional(),
  }),
});

export const deleteQuizSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const shareQuizSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    recipientEmail: z.string().email().optional(),
    expiresInHours: z.number().int().min(1).max(168).optional().default(24),
  }),
});

export const adaptiveStartSchema = z.object({
  body: z.object({
    topic: z.string().min(1),
    subject: z.string().min(1),
    initialDifficulty: z.string().optional().default('MEDIUM'),
    organizationId: z.string().uuid().optional(),
  }),
});

export const adaptiveNextSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
    lastQuestionId: z.string().uuid().optional(),
    lastAnswer: z.string().optional(),
  }),
});

export const adaptiveCompleteSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid(),
  }),
});

export const listSessionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).optional(),
  }),
});
