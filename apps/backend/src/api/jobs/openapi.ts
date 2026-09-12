export const jobsPaths = {
  '/jobs': {
    get: {
      tags: ['Jobs'],
      summary: 'List recent jobs (paginated)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        { $ref: '#/components/parameters/sortParam' },
        { $ref: '#/components/parameters/orderParam' },
        { in: 'query', name: 'status', schema: { type: 'string' } },
        { in: 'query', name: 'jobType', schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'Paginated list of jobs' } },
    },
  },
  '/jobs/{jobId}': {
    get: {
      tags: ['Jobs'],
      summary: 'Get job status',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Job status' },
        '404': { description: 'Job not found' },
      },
    },
    delete: {
      tags: ['Jobs'],
      summary: 'Clean up completed/failed job',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '204': { description: 'Job cleaned up' },
        '404': { description: 'Job not found' },
      },
    },
  },
  '/jobs/{jobId}/cancel': {
    post: {
      tags: ['Jobs'],
      summary: 'Cancel a running job',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Job cancelled' },
        '404': { description: 'Job not found' },
      },
    },
  },
  '/jobs/{jobId}/logs': {
    get: {
      tags: ['Jobs'],
      summary: 'Get job execution logs',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Job logs' },
        '404': { description: 'Job not found' },
      },
    },
  },
};
