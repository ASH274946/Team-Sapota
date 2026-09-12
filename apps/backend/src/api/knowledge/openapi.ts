interface OpenAPIObject {
  paths: Record<string, unknown>;
}

export function getKnowledgeOpenApiPaths(): Pick<OpenAPIObject, 'paths'> {
  return {
    paths: {
      '/knowledge/quality': {
        get: {
          tags: ['Knowledge'],
          summary: 'Get quality scores',
          description: 'Paginated list of knowledge quality scores.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
            { $ref: '#/components/parameters/sortParam' },
            { $ref: '#/components/parameters/orderParam' },
            { in: 'query', name: 'minScore', schema: { type: 'number' } },
            { in: 'query', name: 'maxScore', schema: { type: 'number' } },
          ],
          responses: {
            '200': { description: 'Paginated quality scores' },
          },
        },
      },
      '/knowledge/quality/{documentId}': {
        get: {
          tags: ['Knowledge'],
          summary: 'Get document quality',
          description: 'Get quality scores for all chunks of a specific document.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'documentId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': { description: 'Document quality scores' },
            '404': { description: 'Document not found' },
          },
        },
      },
      '/knowledge/evaluate': {
        post: {
          tags: ['Knowledge'],
          summary: 'Trigger evaluation',
          description: 'Trigger knowledge quality evaluation as an async job.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    documentId: { type: 'string', format: 'uuid' },
                    organizationId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          responses: {
            '202': { description: 'Evaluation triggered' },
          },
        },
      },
      '/knowledge/evaluate/{jobId}': {
        get: {
          tags: ['Knowledge'],
          summary: 'Check evaluation job',
          description: 'Check the status of an evaluation job.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'jobId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': { description: 'Evaluation job status' },
            '404': { description: 'Job not found' },
          },
        },
      },
      '/knowledge/chunks/{chunkId}/quality': {
        get: {
          tags: ['Knowledge'],
          summary: 'Get chunk quality',
          description: 'Get quality metrics for a specific chunk.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'chunkId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': { description: 'Chunk quality metrics' },
            '404': { description: 'Chunk or metrics not found' },
          },
        },
      },
      '/knowledge/reports': {
        get: {
          tags: ['Knowledge'],
          summary: 'Generate quality report',
          description: 'Generate a knowledge quality report for the organization.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Quality report' },
            '404': { description: 'No quality data available' },
          },
        },
      },
    },
  };
}
