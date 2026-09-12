export const learningPaths = {
  '/learning/profiles': {
    get: {
      tags: ['Learning'],
      summary: 'List learning profiles (paginated)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        { $ref: '#/components/parameters/sortParam' },
        { $ref: '#/components/parameters/orderParam' },
      ],
      responses: {
        '200': { description: 'Paginated list of learning profiles' },
      },
    },
  },
  '/learning/profiles/{studentId}': {
    get: {
      tags: ['Learning'],
      summary: 'Get student learning profile',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Learning profile' },
        '404': { description: 'Profile not found' },
      },
    },
    put: {
      tags: ['Learning'],
      summary: 'Update learning profile',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                weakConcepts: { type: 'array', items: { type: 'string' } },
                masteryLevel: { type: 'number', minimum: 0, maximum: 100 },
                learningStyle: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Profile updated' },
      },
    },
  },
  '/learning/profiles/{studentId}/predictions': {
    get: {
      tags: ['Learning'],
      summary: 'Get predictive analytics for a student',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Predictive analytics' },
      },
    },
  },
  '/learning/profiles/{studentId}/refresh': {
    post: {
      tags: ['Learning'],
      summary: 'Refresh and recalculate learning profile',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Profile refreshed' },
      },
    },
  },
  '/learning/study-plans/{studentId}': {
    get: {
      tags: ['Learning'],
      summary: 'Get study plans for a student',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'List of study plans' },
      },
    },
  },
  '/learning/study-plans/{studentId}/generate': {
    post: {
      tags: ['Learning'],
      summary: 'Generate personalized study plan',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Study plan generated' },
      },
    },
  },
  '/learning/insights/{studentId}': {
    get: {
      tags: ['Learning'],
      summary: 'Get learning insights for a student',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Learning insights' },
      },
    },
  },
  '/learning/identify-at-risk': {
    post: {
      tags: ['Learning'],
      summary: 'Identify at-risk students (async job)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                thresholds: {
                  type: 'object',
                  properties: {
                    minScore: { type: 'number', minimum: 0, maximum: 100 },
                    maxAbsences: { type: 'integer', minimum: 0 },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '202': { description: 'Job queued' },
      },
    },
  },
  '/learning/identify-at-risk/{jobId}': {
    get: {
      tags: ['Learning'],
      summary: 'Check at-risk identification job status',
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
};
