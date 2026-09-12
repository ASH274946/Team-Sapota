import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const jobIdParamSchema = z.object({
  params: z.object({
    jobId: z.string(),
  }),
});

export const generatePaperSchema = z.object({
  body: z.object({
    assignmentId: z.string().uuid(),
    regenerate: z.boolean().optional().default(false),
  }),
});

export const listPapersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sort: z.string().optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  }),
});
