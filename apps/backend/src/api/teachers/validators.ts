import { z } from 'zod';
import { paginationQuerySchema, idParamSchema } from '../common/validators';

export const listTeachersQuerySchema = paginationQuerySchema.extend({
  query: paginationQuerySchema.shape.query.extend({
    departmentId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).optional(),
  }),
});

export { idParamSchema };
