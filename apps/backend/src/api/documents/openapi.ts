interface OpenAPIObject {
  paths: Record<string, unknown>;
}

export function getDocumentsOpenApiPaths(): Pick<OpenAPIObject, 'paths'> {
  return {
    paths: {
      '/documents/upload': {
        post: {
          tags: ['Documents'],
          summary: 'Upload document',
          description: 'Upload a document file (PDF, DOCX, TXT). Rate limited.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Document uploaded' },
            '400': { description: 'Invalid file or validation error' },
            '429': { description: 'Rate limit exceeded' },
          },
        },
      },
      '/documents/parse': {
        post: {
          tags: ['Documents'],
          summary: 'Parse document',
          description: 'Queue a document for OCR/text extraction.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['documentId'],
                  properties: { documentId: { type: 'string', format: 'uuid' } },
                },
              },
            },
          },
          responses: {
            '202': { description: 'Parse job queued' },
            '404': { description: 'Document not found' },
          },
        },
      },
      '/documents': {
        get: {
          tags: ['Documents'],
          summary: 'List documents',
          description: 'Paginated list of uploaded documents.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
            { $ref: '#/components/parameters/sortParam' },
            { $ref: '#/components/parameters/orderParam' },
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'fileType', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Paginated document list' },
          },
        },
      },
      '/documents/{id}': {
        get: {
          tags: ['Documents'],
          summary: 'Get document',
          description: 'Retrieve document details.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '200': { description: 'Document details' },
            '404': { description: 'Document not found' },
          },
        },
        delete: {
          tags: ['Documents'],
          summary: 'Delete document',
          description: 'Delete an uploaded document.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '200': { description: 'Document deleted' },
            '404': { description: 'Document not found' },
          },
        },
      },
      '/documents/{id}/process': {
        post: {
          tags: ['Documents'],
          summary: 'Process document',
          description: 'Queue a document for embedding/indexing.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '202': { description: 'Processing job queued' },
            '404': { description: 'Document not found' },
          },
        },
      },
      '/documents/{id}/jobs/{jobId}': {
        get: {
          tags: ['Documents'],
          summary: 'Check job status',
          description: 'Check the status of a document processing job.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/idParam' },
            { in: 'path', name: 'jobId', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': { description: 'Job status' },
            '404': { description: 'Document or job not found' },
          },
        },
      },
    },
  };
}
