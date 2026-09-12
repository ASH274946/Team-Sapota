import { z } from 'zod';

const uuidParam = z.string().uuid();

export const idParamSchema = z.object({
  params: z.object({ id: uuidParam }),
});

export const courseIdParamSchema = z.object({
  params: z.object({ courseId: uuidParam }),
});

export const programIdParamSchema = z.object({
  params: z.object({ programId: uuidParam }),
});

export const createCourseSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    code: z.string().min(1).max(50),
    description: z.string().optional(),
    departmentId: uuidParam.optional(),
  }),
});

export const createProgramSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    code: z.string().min(1).max(50),
    description: z.string().optional(),
  }),
});

export const createCourseOutcomeSchema = z.object({
  params: z.object({ courseId: uuidParam }),
  body: z.object({
    code: z.string().min(1).max(50),
    description: z.string().min(1),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
  }),
});

export const updateCourseOutcomeSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    description: z.string().min(1).optional(),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
  }),
});

export const createProgramOutcomeSchema = z.object({
  params: z.object({ programId: uuidParam }),
  body: z.object({
    code: z.string().min(1).max(50),
    description: z.string().min(1),
  }),
});

export const updateProgramOutcomeSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    description: z.string().min(1).optional(),
  }),
});

export const upsertCoPoMappingSchema = z.object({
  body: z.object({
    coId: uuidParam,
    poId: uuidParam,
    weightage: z.number().int().min(1).max(5),
    reason: z.string().optional(),
  }),
});

export const bulkUpsertCoPoMappingSchema = z.object({
  body: z.object({
    mappings: z.array(
      z.object({
        coId: uuidParam,
        poId: uuidParam,
        weightage: z.number().int().min(1).max(5),
      })
    ).min(1),
    reason: z.string().optional(),
  }),
});

export const createBlueprintSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    courseId: uuidParam,
    totalMarks: z.number().int().min(1),
    items: z.array(
      z.object({
        coId: uuidParam,
        title: z.string().min(1),
        marks: z.number().int().min(1),
        count: z.number().int().min(1).optional(),
        bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
        itemType: z.enum(['OBJECTIVE', 'SHORT_ANSWER', 'LONG_ANSWER', 'PRACTICAL', 'MCQ']).optional(),
        topic: z.string().optional(),
      })
    ).optional(),
  }),
});

export const addBlueprintItemSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    coId: uuidParam,
    title: z.string().min(1),
    marks: z.number().int().min(1),
    count: z.number().int().min(1).optional(),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
    itemType: z.enum(['OBJECTIVE', 'SHORT_ANSWER', 'LONG_ANSWER', 'PRACTICAL', 'MCQ']).optional(),
    topic: z.string().optional(),
  }),
});

export const updateBlueprintItemSchema = z.object({
  params: z.object({ blueprintId: uuidParam, itemId: uuidParam }),
  body: z.object({
    title: z.string().min(1).optional(),
    marks: z.number().int().min(1).optional(),
    count: z.number().int().min(1).optional(),
    bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
    itemType: z.enum(['OBJECTIVE', 'SHORT_ANSWER', 'LONG_ANSWER', 'PRACTICAL', 'MCQ']).optional(),
    topic: z.string().optional(),
  }),
});

export const approveBlueprintSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    comments: z.string().optional(),
  }),
});

export const rejectBlueprintSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    reason: z.string().min(1),
  }),
});

export const attainmentQuerySchema = z.object({
  query: z.object({
    threshold: z.coerce.number().min(0).max(1).optional(),
  }).partial(),
});

export const coPoMatrixParamSchema = z.object({
  params: z.object({ id: uuidParam }),
});

export const updateCoPoMatrixSchema = z.object({
  params: z.object({ id: uuidParam }),
  body: z.object({
    mappings: z.array(
      z.object({
        coId: uuidParam,
        poId: uuidParam,
        weightage: z.number().int().min(0).max(5),
      })
    ).optional(),
    bloomOverrides: z.array(
      z.object({
        coId: uuidParam,
        bloomLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']),
      })
    ).optional(),
    reason: z.string().optional(),
  }),
});

export const classifyBloomSchema = z.object({
  body: z.object({
    text: z.string().min(1),
    config: z.object({
      version: z.string().optional(),
      customVerbs: z.record(z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])).optional(),
      levelWeights: z.record(z.number()).optional(),
    }).optional(),
  }),
});
