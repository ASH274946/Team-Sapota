export const reportsPaths = {
  '/reports/generate/assignment': {
    post: {
      tags: ['Reports'],
      summary: 'Generate assignment report (async job)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                assignmentId: { type: 'string', format: 'uuid' },
                format: { type: 'string', enum: ['pdf', 'csv', 'json'], default: 'pdf' },
              },
              required: ['assignmentId'],
            },
          },
        },
      },
      responses: {
        '202': { description: 'Report generation queued' },
        '400': { description: 'Validation error' },
        '403': { description: 'Insufficient permissions' },
      },
    },
  },
  '/reports/generate/{jobId}': {
    get: {
      tags: ['Reports'],
      summary: 'Check report generation status',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Job status' },
        '404': { description: 'Job not found' },
      },
    },
  },
  '/reports/assignment/{assignmentId}': {
    get: {
      tags: ['Reports'],
      summary: 'Get assignment report',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'assignmentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Assignment report' },
        '404': { description: 'Assignment not found' },
      },
    },
  },
  '/reports/student/{studentId}': {
    get: {
      tags: ['Reports'],
      summary: 'Get student report',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Student report' },
        '404': { description: 'Student not found' },
      },
    },
  },
  '/reports/class/{classId}': {
    get: {
      tags: ['Reports'],
      summary: 'Get class report',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'classId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Class report' },
        '404': { description: 'Class not found' },
      },
    },
  },
  '/reports/organization/{orgId}': {
    get: {
      tags: ['Reports'],
      summary: 'Get organization report',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'orgId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Organization report' },
        '404': { description: 'Organization not found' },
      },
    },
  },
  '/reports/download/{reportId}': {
    get: {
      tags: ['Reports'],
      summary: 'Download generated report',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'reportId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Report download URL' },
        '404': { description: 'Report not found' },
      },
    },
  },
};
