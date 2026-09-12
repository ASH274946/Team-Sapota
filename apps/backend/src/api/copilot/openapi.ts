export const copilotPaths = {
  '/copilot/assist': {
    post: {
      tags: ['Copilot'],
      summary: 'Get AI assistance for teaching tasks',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                query: { type: 'string', example: 'How to teach fractions?' },
                context: { type: 'string' },
                subject: { type: 'string' },
              },
              required: ['query'],
            },
          },
        },
      },
      responses: { '200': { description: 'AI assistance response' } },
    },
  },
  '/copilot/generate-lesson-plan': {
    post: {
      tags: ['Copilot'],
      summary: 'Generate lesson plan',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                subject: { type: 'string' },
                topic: { type: 'string' },
                duration: { type: 'string' },
                learningOutcomes: { type: 'array', items: { type: 'string' } },
              },
              required: ['subject', 'topic', 'duration', 'learningOutcomes'],
            },
          },
        },
      },
      responses: { '200': { description: 'Lesson plan generated' } },
    },
  },
  '/copilot/generate-activity': {
    post: {
      tags: ['Copilot'],
      summary: 'Generate classroom activity',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                subject: { type: 'string' },
                topic: { type: 'string' },
                duration: { type: 'string' },
                groupSize: { type: 'integer' },
                objectives: { type: 'array', items: { type: 'string' } },
              },
              required: ['subject', 'topic'],
            },
          },
        },
      },
      responses: { '200': { description: 'Activity generated' } },
    },
  },
  '/copilot/generate-worksheet': {
    post: {
      tags: ['Copilot'],
      summary: 'Generate worksheet',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                subject: { type: 'string' },
                topic: { type: 'string' },
                difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
              },
              required: ['title', 'subject', 'topic', 'difficulty'],
            },
          },
        },
      },
      responses: { '200': { description: 'Worksheet generated' } },
    },
  },
  '/copilot/history': {
    get: {
      tags: ['Copilot'],
      summary: 'Get copilot history',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Copilot history' } },
    },
  },
  '/copilot/feedback': {
    post: {
      tags: ['Copilot'],
      summary: 'Submit copilot feedback',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                historyId: { type: 'string', format: 'uuid' },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
              },
              required: ['historyId', 'rating'],
            },
          },
        },
      },
      responses: { '200': { description: 'Feedback submitted' } },
    },
  },
};
