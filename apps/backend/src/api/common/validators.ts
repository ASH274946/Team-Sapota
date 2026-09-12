import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const idParamSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sort: z.string().optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional().default(''),
  }),
});

export const dateRangeSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});
