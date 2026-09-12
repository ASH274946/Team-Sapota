import { z } from 'zod';
import { paginationQuerySchema, idParamSchema } from '../common/validators';

export const listStudentsQuerySchema = paginationQuerySchema.extend({
  groupId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED']).optional(),
});

export const progressQuerySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }),
});

export const performanceQuerySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    subjectId: z.string().uuid().optional(),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }),
});

export { idParamSchema };
