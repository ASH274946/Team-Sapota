interface OpenAPIObject {
  paths: Record<string, unknown>;
}

export function getSyllabusOpenApiPaths(): Pick<OpenAPIObject, 'paths'> {
  return {
    paths: {
      '/syllabus': {
        get: {
          tags: ['Syllabus'],
          summary: 'List syllabus entries',
          description: 'Paginated list of syllabus entries.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
            { $ref: '#/components/parameters/sortParam' },
            { $ref: '#/components/parameters/orderParam' },
            { $ref: '#/components/parameters/searchParam' },
            { in: 'query', name: 'subject', schema: { type: 'string' } },
            { in: 'query', name: 'status', schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Paginated syllabus entries' },
          },
        },
        post: {
          tags: ['Syllabus'],
          summary: 'Create syllabus entry',
          description: 'Create a new syllabus. Requires ADMIN or TEACHER role.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'subject'],
                  properties: {
                    title: { type: 'string' },
                    subject: { type: 'string' },
                    grade: { type: 'string' },
                    description: { type: 'string' },
                    topics: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          description: { type: 'string' },
                          duration: { type: 'integer' },
                          subtopics: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: { title: { type: 'string' } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Syllabus created' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/syllabus/{id}': {
        get: {
          tags: ['Syllabus'],
          summary: 'Get syllabus entry',
          description: 'Retrieve a syllabus entry with its topics.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '200': { description: 'Syllabus with topics' },
            '404': { description: 'Syllabus not found' },
          },
        },
        put: {
          tags: ['Syllabus'],
          summary: 'Update syllabus',
          description: 'Update a syllabus entry. Requires ADMIN or TEACHER role.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    subject: { type: 'string' },
                    grade: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'archived', 'draft'] },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Syllabus updated' },
            '404': { description: 'Syllabus not found' },
          },
        },
        delete: {
          tags: ['Syllabus'],
          summary: 'Delete syllabus',
          description: 'Delete a syllabus entry. Requires ADMIN role.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '200': { description: 'Syllabus deleted' },
            '404': { description: 'Syllabus not found' },
          },
        },
      },
      '/syllabus/{id}/topics': {
        post: {
          tags: ['Syllabus'],
          summary: 'Add topic to syllabus',
          description: 'Add a new topic to an existing syllabus. Requires ADMIN or TEACHER role.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    duration: { type: 'integer' },
                    subtopics: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: { title: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Topic created' },
            '404': { description: 'Syllabus not found' },
          },
        },
      },
      '/syllabus/topics/{topicId}': {
        put: {
          tags: ['Syllabus'],
          summary: 'Update topic',
          description: 'Update a topic. Requires ADMIN or TEACHER role.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'topicId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    duration: { type: 'integer' },
                    completed: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Topic updated' },
            '404': { description: 'Topic not found' },
          },
        },
        delete: {
          tags: ['Syllabus'],
          summary: 'Delete topic',
          description: 'Remove a topic from a syllabus. Requires ADMIN or TEACHER role.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'topicId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': { description: 'Topic removed' },
            '404': { description: 'Topic not found' },
          },
        },
      },
      '/syllabus/topics/{topicId}/subtopics': {
        put: {
          tags: ['Syllabus'],
          summary: 'Update subtopics',
          description: 'Replace subtopics for a topic. Requires ADMIN or TEACHER role.',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'topicId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['subtopics'],
                  properties: {
                    subtopics: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          title: { type: 'string' },
                          topicOrder: { type: 'integer' },
                          completed: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Subtopics updated' },
            '404': { description: 'Topic not found' },
          },
        },
      },
    },
  };
}
