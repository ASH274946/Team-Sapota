import { z } from 'zod';

export const storageScopeEnum = z.enum([
  'students',
  'teachers',
  'admins',
  'blogs',
  'courses',
  'syllabus',
  'assignments',
  'documents',
  'question-papers',
  'quizzes',
  'lesson-plans',
  'evaluations',
  'knowledge',
  'uploads',
]);

export const presignUploadSchema = z.object({
  body: z.object({
    filename: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    sizeBytes: z.number().int().positive().max(100 * 1024 * 1024), // Max 100MB
    scope: storageScopeEnum,
    entityId: z.string().min(1).max(100),
    subFolder: z.string().max(100).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const completeUploadSchema = z.object({
  body: z.object({
    key: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    scope: storageScopeEnum,
    entityId: z.string().min(1),
    isPublic: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

export const getFileAccessSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const getFileByKeySchema = z.object({
  query: z.object({
    key: z.string().min(1),
  }),
});
