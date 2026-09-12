import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    role: z.string(),
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
    organizationId: z.string().uuid().nullable().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    status: z.string().optional(),
  }),
});

export const changeRoleSchema = z.object({
  body: z.object({
    role: z.string().min(1),
  }),
});

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(50),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    adminEmail: z.string().email().optional(),
  }),
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    code: z.string().min(1).max(50).optional(),
    email: z.string().email().nullable().optional(),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    status: z.string().optional(),
    adminEmail: z.string().email().optional(),
  }),
});

export const updateSystemSettingsSchema = z.object({
  body: z.object({
    allowRegistration: z.boolean().optional(),
    maxUploadSizeMb: z.number().int().min(1).optional(),
    maintenanceMode: z.boolean().optional(),
    defaultLanguage: z.string().optional(),
    features: z.record(z.boolean()).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
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
