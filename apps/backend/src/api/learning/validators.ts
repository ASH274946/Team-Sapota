import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    weakConcepts: z.array(z.string()).optional(),
    masteryLevel: z.number().min(0).max(100).optional(),
    learningStyle: z.string().optional(),
  }),
});

export const studentIdParamSchema = z.object({
  params: z.object({
    studentId: z.string().uuid(),
  }),
});

export const identifyAtRiskSchema = z.object({
  body: z.object({
    thresholds: z
      .object({
        minScore: z.number().min(0).max(100).optional(),
        maxAbsences: z.number().int().min(0).optional(),
      })
      .optional(),
  }),
});

export const jobIdParamSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
});
