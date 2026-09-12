interface OpenAPIObject {
  paths: Record<string, unknown>;
}

export function getRagOpenApiPaths(): Pick<OpenAPIObject, 'paths'> {
  return {
    paths: {
      '/rag/search': {
        post: {
          tags: ['RAG'],
          summary: 'Hybrid search',
          description: 'Perform hybrid search (vector + BM25) across the knowledge base.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string' },
                    limit: { type: 'integer', default: 10 },
                    organizationId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Search results with scores' },
          },
        },
      },
      '/rag/retrieve': {
        post: {
          tags: ['RAG'],
          summary: 'Retrieve context',
          description: 'Retrieve context for a query using hybrid search and graph expansion.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string' },
                    limit: { type: 'integer', default: 5 },
                    organizationId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Retrieved context string' },
          },
        },
      },
      '/rag/documents': {
        get: {
          tags: ['RAG'],
          summary: 'List indexed documents',
          description: 'Paginated list of indexed documents in the RAG system.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
            { $ref: '#/components/parameters/sortParam' },
            { $ref: '#/components/parameters/orderParam' },
            { in: 'query', name: 'status', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Paginated indexed documents' },
          },
        },
      },
      '/rag/documents/{id}/reindex': {
        post: {
          tags: ['RAG'],
          summary: 'Re-index document',
          description: 'Re-index a document (delete and re-process all chunks).',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '202': { description: 'Re-index accepted' },
            '404': { description: 'Document not found' },
          },
        },
      },
      '/rag/query': {
        post: {
          tags: ['RAG'],
          summary: 'Direct RAG query',
          description: 'Query + retrieve context + generate answer via LLM.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string' },
                    context: { type: 'string' },
                    organizationId: { type: 'string', format: 'uuid' },
                    model: { type: 'string', default: 'gpt-4o-mini' },
                    systemPrompt: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'RAG query answer with context' },
          },
        },
      },
      '/rag/stats': {
        get: {
          tags: ['RAG'],
          summary: 'Get RAG stats',
          description: 'Get statistics about the RAG system.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'RAG system statistics' },
          },
        },
      },
    },
  };
}
