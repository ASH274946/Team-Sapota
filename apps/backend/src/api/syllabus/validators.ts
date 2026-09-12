import { z } from 'zod';
import { paginationQuerySchema, idParamSchema } from '../common/validators';

const subtopicSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  completed: z.boolean().optional(),
});

const topicSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  duration: z.number().int().min(1).optional(),
  subtopics: z.array(subtopicSchema).optional(),
});

export const createSyllabusSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    subject: z.string().min(1).max(255),
    subjectId: z.string().uuid().optional(),
    grade: z.string().max(50).optional(),
    description: z.string().max(5000).optional(),
    topics: z.array(topicSchema).optional(),
  }),
});

export const updateSyllabusSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    subject: z.string().min(1).max(255).optional(),
    grade: z.string().max(50).optional(),
    status: z.enum(['active', 'archived', 'draft']).optional(),
    description: z.string().max(5000).optional(),
  }),
});

export const listSyllabusSchema = z.object({
  query: paginationQuerySchema.shape.query.extend({
    subject: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const syllabusIdParamSchema = idParamSchema;

export const addTopicSchema = z.object({
  body: topicSchema,
});

export const updateTopicSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional(),
    duration: z.number().int().min(1).optional(),
    completed: z.boolean().optional(),
  }),
});

export const topicIdParamSchema = z.object({
  params: z.object({
    topicId: z.string().uuid(),
  }),
});

export const updateSubtopicsSchema = z.object({
  body: z.object({
    subtopics: z.array(
      z.object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(255),
        topicOrder: z.number().int().min(0).optional(),
        completed: z.boolean().optional(),
      })
    ).min(1),
  }),
});

export const deleteSyllabusSchema = idParamSchema;
