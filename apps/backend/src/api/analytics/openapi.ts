export const analyticsPaths = {
  '/analytics/dashboard': {
    get: {
      tags: ['Analytics'],
      summary: 'Get dashboard statistics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Dashboard stats' } },
    },
  },
  '/analytics/assignments': {
    get: {
      tags: ['Analytics'],
      summary: 'Get assignment analytics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Assignment analytics' } },
    },
  },
  '/analytics/quizzes': {
    get: {
      tags: ['Analytics'],
      summary: 'Get quiz analytics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Quiz analytics' } },
    },
  },
  '/analytics/students': {
    get: {
      tags: ['Analytics'],
      summary: 'Get student performance analytics',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'studentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: { '200': { description: 'Student performance' } },
    },
  },
  '/analytics/teachers': {
    get: {
      tags: ['Analytics'],
      summary: 'Get teacher performance analytics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Teacher performance' } },
    },
  },
  '/analytics/usage': {
    get: {
      tags: ['Analytics'],
      summary: 'Get API and resource usage stats',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Usage stats' } },
    },
  },
  '/analytics/ai-usage': {
    get: {
      tags: ['Analytics'],
      summary: 'Get AI endpoint usage stats',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'AI usage stats' } },
    },
  },
  '/analytics/trends': {
    get: {
      tags: ['Analytics'],
      summary: 'Get trend data over time',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'metric', schema: { type: 'string' } },
        { in: 'query', name: 'period', schema: { type: 'string', enum: ['7d', '30d', '90d', '1y'] } },
      ],
      responses: { '200': { description: 'Trend data' } },
    },
  },
  '/analytics/export/{type}': {
    get: {
      tags: ['Analytics'],
      summary: 'Export analytics data (CSV/JSON)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'type', required: true, schema: { type: 'string', enum: ['csv', 'json'] } },
      ],
      responses: { '200': { description: 'Exported data' } },
    },
  },
};
