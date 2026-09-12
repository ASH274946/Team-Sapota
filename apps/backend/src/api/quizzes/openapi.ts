import { OpenAPIV3 } from 'openapi-types';

const quizPaths: OpenAPIV3.PathsObject = {
  '/quizzes/generate': {
    post: {
      tags: ['Quizzes'],
      summary: 'Generate quiz questions (rate limited)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                subject: { type: 'string' },
                difficulty: { type: 'string' },
                bloomLevel: { type: 'string' },
                count: { type: 'integer', default: 5 },
              },
              required: ['topic', 'subject', 'difficulty'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Generated questions' },
        '429': { description: 'Rate limited' },
      },
    },
  },
  '/quizzes/sessions': {
    get: {
      tags: ['Quizzes'],
      summary: 'List quiz sessions',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] } },
      ],
      responses: {
        '200': { description: 'Paginated list of sessions' },
      },
    },
    post: {
      tags: ['Quizzes'],
      summary: 'Save quiz session',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                subject: { type: 'string' },
                difficulty: { type: 'string' },
                totalQuestions: { type: 'integer', default: 10 },
              },
              required: ['topic', 'subject', 'difficulty'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Session created' },
      },
    },
  },
  '/quizzes/sessions/{id}': {
    get: {
      tags: ['Quizzes'],
      summary: 'Get quiz session with questions',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Session details' },
        '404': { description: 'Not found' },
      },
    },
    put: {
      tags: ['Quizzes'],
      summary: 'Update quiz session',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                timeSpent: { type: 'number' },
                attempts: { type: 'integer' },
                status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Session updated' },
        '404': { description: 'Not found' },
      },
    },
    delete: {
      tags: ['Quizzes'],
      summary: 'Delete quiz session',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '204': { description: 'Deleted' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/quizzes/history': {
    get: {
      tags: ['Quizzes'],
      summary: 'Get quiz history',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        '200': { description: 'Paginated quiz history' },
      },
    },
    delete: {
      tags: ['Quizzes'],
      summary: 'Clear quiz history',
      security: [{ bearerAuth: [] }],
      responses: {
        '204': { description: 'Cleared' },
      },
    },
  },
  '/quizzes/share': {
    post: {
      tags: ['Quizzes'],
      summary: 'Share quiz',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', format: 'uuid' },
                recipientEmail: { type: 'string', format: 'email' },
                expiresInHours: { type: 'integer', default: 24 },
              },
              required: ['sessionId'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Quiz shared' },
      },
    },
  },
  '/quizzes/shared/{id}': {
    get: {
      tags: ['Quizzes'],
      summary: 'Get shared quiz',
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: {
        '200': { description: 'Shared quiz data' },
        '404': { description: 'Not found or expired' },
      },
    },
  },
  '/quizzes/adaptive/start': {
    post: {
      tags: ['Quizzes'],
      summary: 'Start adaptive quiz',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                subject: { type: 'string' },
                initialDifficulty: { type: 'string', default: 'MEDIUM' },
              },
              required: ['topic', 'subject'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Adaptive quiz started' },
      },
    },
  },
  '/quizzes/adaptive/next': {
    post: {
      tags: ['Quizzes'],
      summary: 'Get next adaptive question',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', format: 'uuid' },
                lastQuestionId: { type: 'string', format: 'uuid' },
                lastAnswer: { type: 'string' },
              },
              required: ['sessionId'],
            },
          },
        },
      },
      responses: {
        '200': { description: 'Next question' },
      },
    },
  },
  '/quizzes/adaptive/complete': {
    post: {
      tags: ['Quizzes'],
      summary: 'Complete adaptive quiz session',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string', format: 'uuid' },
              },
              required: ['sessionId'],
            },
          },
        },
      },
      responses: {
        '200': { description: 'Session completed with analytics' },
      },
    },
  },
};

export default quizPaths;
