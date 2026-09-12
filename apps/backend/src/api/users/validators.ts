import { z } from 'zod';
import { paginationQuerySchema, idParamSchema } from '../common/validators';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().transform((e) => e.trim().toLowerCase()),
    password: z.string().min(6).optional(),
    firstName: z.string().min(1).max(100).transform((s) => s.trim()),
    lastName: z.string().min(1).max(100).transform((s) => s.trim()),
    role: z.string().min(1),
    phone: z.string().optional(),
    organizationId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    organizationId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const changeUserRoleSchema = z.object({
  body: z.object({
    role: z.string().min(1, 'Role is required'),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listUsersQuerySchema = paginationQuerySchema;

export { idParamSchema };
