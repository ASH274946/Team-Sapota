import { z } from 'zod';

export const jobIdParamSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
});

export const listJobsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.string().optional(),
    jobType: z.string().optional(),
    sort: z.string().optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});
