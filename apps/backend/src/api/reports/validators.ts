import { z } from 'zod';

export const generateAssignmentReportSchema = z.object({
  body: z.object({
    assignmentId: z.string().uuid(),
    format: z.enum(['pdf', 'csv', 'json']).optional().default('pdf'),
  }),
});

export const generateReportSchema = z.object({
  body: z.object({
    assignmentId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    orgId: z.string().uuid().optional(),
    format: z.enum(['pdf', 'csv', 'json']).optional().default('pdf'),
  }),
});

export const jobIdParamSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
});

export const assignmentIdParamSchema = z.object({
  params: z.object({
    assignmentId: z.string().uuid(),
  }),
});

export const studentIdParamSchema = z.object({
  params: z.object({
    studentId: z.string().uuid(),
  }),
});

export const classIdParamSchema = z.object({
  params: z.object({
    classId: z.string().uuid(),
  }),
});

export const orgIdParamSchema = z.object({
  params: z.object({
    orgId: z.string().uuid(),
  }),
});

export const reportIdParamSchema = z.object({
  params: z.object({
    reportId: z.string().uuid(),
  }),
});
