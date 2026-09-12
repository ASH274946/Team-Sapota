import { z } from 'zod';
import { paginationQuerySchema, idParamSchema } from '../common/validators';

export const parseDocumentSchema = z.object({
  body: z.object({
    documentId: z.string().uuid(),
  }),
});

export const processDocumentSchema = z.object({
  body: z.object({
    documentId: z.string().uuid().optional(),
  }),
});

export const listDocumentsSchema = z.object({
  query: paginationQuerySchema.shape.query.extend({
    status: z.string().optional(),
    fileType: z.string().optional(),
  }),
});

export const documentIdParamSchema = idParamSchema;

export const checkJobStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    jobId: z.string().uuid(),
  }),
});

export const deleteDocumentSchema = idParamSchema;
