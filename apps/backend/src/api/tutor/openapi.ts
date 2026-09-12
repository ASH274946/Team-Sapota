export const tutorPaths = {
  '/tutor/sessions': {
    post: {
      tags: ['Tutor'],
      summary: 'Create a new tutor session',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                subject: { type: 'string', example: 'Mathematics' },
                tutorMode: { type: 'string', enum: ['SOCRATIC', 'DIRECT'], default: 'SOCRATIC' },
              },
              required: ['subject'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Session created' },
        '400': { description: 'Validation error' },
        '401': { description: 'Authentication required' },
      },
    },
    get: {
      tags: ['Tutor'],
      summary: 'List tutor sessions',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'List of sessions' },
        '401': { description: 'Authentication required' },
      },
    },
  },
  '/tutor/sessions/{sessionId}': {
    get: {
      tags: ['Tutor'],
      summary: 'Get session details with messages',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'sessionId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Session detail' },
        '404': { description: 'Session not found' },
      },
    },
    delete: {
      tags: ['Tutor'],
      summary: 'Delete a tutor session',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'sessionId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '204': { description: 'Session deleted' },
        '404': { description: 'Session not found' },
      },
    },
  },
  '/tutor/sessions/{sessionId}/chat': {
    post: {
      tags: ['Tutor'],
      summary: 'Send message and get AI reply',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'sessionId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { message: { type: 'string', example: 'Explain quadratic equations' } },
              required: ['message'],
            },
          },
        },
      },
      responses: {
        '200': { description: 'AI reply' },
        '404': { description: 'Session not found' },
      },
    },
  },
  '/tutor/sessions/{sessionId}/close': {
    patch: {
      tags: ['Tutor'],
      summary: 'Close a tutor session',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'sessionId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '204': { description: 'Session closed' },
        '404': { description: 'Session not found' },
      },
    },
  },
  '/tutor/config': {
    get: {
      tags: ['Tutor'],
      summary: 'Get tutor configuration',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Tutor config' },
      },
    },
    put: {
      tags: ['Tutor'],
      summary: 'Update tutor configuration',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                allowDirectAnswers: { type: 'boolean' },
                maxExplanationDepth: { type: 'integer', minimum: 1, maximum: 10 },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Config updated' },
        '403': { description: 'Insufficient permissions' },
      },
    },
  },
};
