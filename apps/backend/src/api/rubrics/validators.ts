import { z } from 'zod';

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const exportIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const rubricCriterionSchema: z.ZodObject<any> = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  maxMarks: z.number().min(0),
  minMarks: z.number().min(0).optional(),
  expectedConcepts: z.array(z.string()).optional(),
  expectedKeywords: z.array(z.string()).optional(),
  bloomLevel: z.string().optional(),
  difficulty: z.string().optional(),
  teacherNotes: z.string().optional(),
  subCriteria: z.array(z.lazy(() => rubricCriterionSchema as any)).optional(),
});

export const createRubricSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    department: z.string().optional(),
    course: z.string().optional(),
    subject: z.string().optional(),
    chapter: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.string().optional(),
    language: z.string().optional(),
    criteria: z.array(rubricCriterionSchema).min(1),
  }),
});

export const updateRubricSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    department: z.string().optional(),
    course: z.string().optional(),
    subject: z.string().optional(),
    chapter: z.string().optional(),
    topic: z.string().optional(),
    difficulty: z.string().optional(),
    language: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    criteria: z.array(rubricCriterionSchema).optional(),
  }),
});

export const importRubricSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    criteria: z.array(rubricCriterionSchema).optional(),
    rawText: z.string().optional(),
  }),
});
