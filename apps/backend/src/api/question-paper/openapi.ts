import { OpenAPIV3 } from 'openapi-types';

const questionPaperPaths: OpenAPIV3.PathsObject = {
  '/question-paper/generate': {
    post: {
      tags: ['Question Paper'],
      summary: 'Generate question paper (async)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                assignmentId: { type: 'string', format: 'uuid' },
                regenerate: { type: 'boolean', default: false },
              },
              required: ['assignmentId'],
            },
          },
        },
      },
      responses: {
        '202': { description: 'Generation job queued' },
        '429': { description: 'Rate limited' },
      },
    },
  },
  '/question-paper/generate/{jobId}': {
    get: {
      tags: ['Question Paper'],
      summary: 'Check generation job status',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'jobId', required: true, schema: { type: 'string' } }],
      responses: {
        '200': { description: 'Job status' },
        '404': { description: 'Job not found' },
      },
    },
  },
  '/question-paper': {
    get: {
      tags: ['Question Paper'],
      summary: 'List generated papers (paginated)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] } },
      ],
      responses: {
        '200': { description: 'Paginated list of papers' },
      },
    },
  },
  '/question-paper/{id}': {
    get: {
      tags: ['Question Paper'],
      summary: 'Get paper details with questions',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Paper details' },
        '404': { description: 'Not found' },
      },
    },
    delete: {
      tags: ['Question Paper'],
      summary: 'Delete paper',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '204': { description: 'Deleted' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/question-paper/{id}/publish': {
    post: {
      tags: ['Question Paper'],
      summary: 'Publish paper',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Paper published' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/question-paper/{id}/archive': {
    post: {
      tags: ['Question Paper'],
      summary: 'Archive paper',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Paper archived' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/question-paper/{id}/download': {
    get: {
      tags: ['Question Paper'],
      summary: 'Get paper download URL',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Download URL' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/question-paper/{id}/answer-key': {
    get: {
      tags: ['Question Paper'],
      summary: 'Get answer key',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Answer key' },
        '404': { description: 'Not found' },
      },
    },
  },
};

export default questionPaperPaths;
