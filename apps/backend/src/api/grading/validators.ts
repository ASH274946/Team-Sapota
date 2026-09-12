import { z } from 'zod';

export const assignmentIdParamSchema = z.object({
  params: z.object({
    assignmentId: z.string().uuid(),
  }),
});

export const submissionIdParamSchema = z.object({
  params: z.object({
    submissionId: z.string().uuid(),
  }),
});

export const jobIdParamSchema = z.object({
  params: z.object({
    jobId: z.string(),
  }),
});

export const createGradingConfigSchema = z.object({
  body: z.object({
    answerKeyText: z.string().min(1),
    rubricId: z.string().uuid().optional(),
    aiModel: z.string().optional(),
    passingScore: z.number().min(0).optional(),
    maxAttempts: z.number().int().min(1).optional(),
    gradingType: z.enum(['AUTO', 'MANUAL', 'HYBRID']),
  }),
});

export const updateGradingConfigSchema = z.object({
  body: z.object({
    answerKeyText: z.string().min(1).optional(),
    rubricId: z.string().uuid().nullable().optional(),
    aiModel: z.string().optional(),
    passingScore: z.number().min(0).optional(),
    maxAttempts: z.number().int().min(1).optional(),
    gradingType: z.enum(['AUTO', 'MANUAL', 'HYBRID']).optional(),
  }),
});

export const evaluateSubmissionSchema = z.object({
  params: z.object({
    submissionId: z.string().uuid(),
  }),
});

export const gradeOverrideSchema = z.object({
  params: z.object({
    submissionId: z.string().uuid(),
  }),
  body: z.object({
    score: z.number().min(0),
    reason: z.string().min(1),
    criteriaGrades: z
      .array(
        z.object({
          criterionId: z.string(),
          criterionName: z.string().optional(),
          score: z.number().min(0),
          maxScore: z.number().min(0).optional(),
          explanation: z.string().optional(),
        })
      )
      .optional(),
  }),
});
