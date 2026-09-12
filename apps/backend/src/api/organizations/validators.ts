import { z } from 'zod';
import { paginationQuerySchema, idParamSchema } from '../common/validators';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(20).toUpperCase(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    adminEmail: z.string().email().optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    code: z.string().min(1).max(20).toUpperCase().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
    adminEmail: z.string().email().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(20).toUpperCase(),
    hodId: z.string().uuid().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listOrganizationQuerySchema = paginationQuerySchema;

export { idParamSchema };
