import { z } from 'zod';
import { paginationQuerySchema, idParamSchema } from '../common/validators';

export const getQualityScoresSchema = z.object({
  query: paginationQuerySchema.shape.query.extend({
    organizationId: z.string().uuid().optional(),
    minScore: z.coerce.number().min(0).max(1).optional(),
    maxScore: z.coerce.number().min(0).max(1).optional(),
  }),
});

export const getDocumentQualitySchema = idParamSchema;

export const triggerEvaluationSchema = z.object({
  body: z.object({
    documentId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
  }),
});

export const checkEvaluationJobSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
});

export const getChunkQualitySchema = z.object({
  params: z.object({
    chunkId: z.string().uuid(),
  }),
});

export const getReportsSchema = z.object({
  query: z.object({
    organizationId: z.string().uuid().optional(),
  }),
});
