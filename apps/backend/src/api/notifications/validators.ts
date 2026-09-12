import { z } from 'zod';

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const markReadSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const savePreferencesSchema = z.object({
  body: z.object({
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    digestFrequency: z.enum(['daily', 'weekly', 'never']).optional(),
    types: z.array(z.string()).optional(),
  }),
});
