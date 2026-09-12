import { z } from 'zod';

export const exportTypeParamSchema = z.object({
  params: z.object({
    type: z.enum(['csv', 'json']),
  }),
});

export const analyticsQuerySchema = z.object({
  query: z.object({
    organizationId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('month'),
  }),
});

export const trendQuerySchema = z.object({
  query: z.object({
    metric: z.string().optional().default('score'),
    period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
    organizationId: z.string().uuid().optional(),
  }),
});
