import { z } from 'zod';
import { paginationQuerySchema, idParamSchema } from '../common/validators';

export const createSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    code: z.string().min(1).max(50),
    description: z.string().max(2000).optional(),
    grade: z.string().max(50).optional(),
    credits: z.number().int().min(0).max(50).optional(),
  }),
});

export const updateSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    code: z.string().min(1).max(50).optional(),
    description: z.string().max(2000).optional(),
    grade: z.string().max(50).optional(),
    credits: z.number().int().min(0).max(50).optional(),
  }),
});

export const listSubjectsSchema = z.object({
  query: paginationQuerySchema.shape.query.extend({
    grade: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const subjectIdParamSchema = idParamSchema;
export const getSubjectSyllabusSchema = idParamSchema;
export const getSubjectTeachersSchema = idParamSchema;
export const deleteSubjectSchema = idParamSchema;
