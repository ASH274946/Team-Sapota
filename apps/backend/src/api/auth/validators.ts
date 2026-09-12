import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email().transform((e) => e.trim().toLowerCase()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    firstName: z.string().min(1).max(100).transform((s) => s.trim()),
    lastName: z.string().min(1).max(100).transform((s) => s.trim()),
    role: z.enum(['STUDENT', 'TEACHER']).optional().default('TEACHER'),
    organizationId: z.string().uuid().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().transform((e) => e.trim().toLowerCase()),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const ssoSchema = z.object({
  body: z.object({
    email: z.string().email().transform((e) => e.trim().toLowerCase()),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    provider: z.string().min(1),
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    avatar: z.string().nullable().optional(),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    preferences: z.record(z.unknown()),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  }),
});

export const switchOrganizationSchema = z.object({
  body: z.object({
    organizationId: z.string().uuid('Valid organization ID is required'),
  }),
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid session ID is required'),
  }),
});
