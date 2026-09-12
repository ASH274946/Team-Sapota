interface OpenAPIObject {
  paths: Record<string, unknown>;
}

export function getSubjectsOpenApiPaths(): Pick<OpenAPIObject, 'paths'> {
  return {
    paths: {
      '/subjects': {
        get: {
          tags: ['Subjects'],
          summary: 'List subjects',
          description: 'Paginated list of subjects scoped to the organization.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/pageParam' },
            { $ref: '#/components/parameters/limitParam' },
            { $ref: '#/components/parameters/sortParam' },
            { $ref: '#/components/parameters/orderParam' },
            { $ref: '#/components/parameters/searchParam' },
            {
              in: 'query',
              name: 'grade',
              schema: { type: 'string' },
              description: 'Filter by grade level',
            },
          ],
          responses: {
            '200': { description: 'Paginated list of subjects' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
        post: {
          tags: ['Subjects'],
          summary: 'Create subject',
          description: 'Create a new subject. Requires ADMIN or TEACHER role.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'code'],
                  properties: {
                    name: { type: 'string', example: 'Advanced Mathematics' },
                    code: { type: 'string', example: 'MATH301' },
                    description: { type: 'string' },
                    grade: { type: 'string', example: 'Grade 11' },
                    credits: { type: 'integer', example: 4 },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Subject created' },
            '400': { description: 'Validation error' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
          },
        },
      },
      '/subjects/{id}': {
        get: {
          tags: ['Subjects'],
          summary: 'Get subject',
          description: 'Retrieve a single subject by ID.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '200': { description: 'Subject details' },
            '404': { description: 'Subject not found' },
          },
        },
        put: {
          tags: ['Subjects'],
          summary: 'Update subject',
          description: 'Update subject details. Requires ADMIN or TEACHER role.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    code: { type: 'string' },
                    description: { type: 'string' },
                    grade: { type: 'string' },
                    credits: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Subject updated' },
            '404': { description: 'Subject not found' },
          },
        },
        delete: {
          tags: ['Subjects'],
          summary: 'Delete subject',
          description: 'Delete a subject. Requires ADMIN role.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '200': { description: 'Subject deleted' },
            '403': { $ref: '#/components/responses/ForbiddenError' },
            '404': { description: 'Subject not found' },
          },
        },
      },
      '/subjects/{id}/syllabus': {
        get: {
          tags: ['Subjects'],
          summary: 'Get subject syllabus',
          description: 'Retrieve the syllabus associated with a subject.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '200': { description: 'Subject syllabus with topics' },
            '404': { description: 'Subject or syllabus not found' },
          },
        },
      },
      '/subjects/{id}/teachers': {
        get: {
          tags: ['Subjects'],
          summary: 'List subject teachers',
          description: 'List teachers assigned to a subject.',
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: '#/components/parameters/idParam' }],
          responses: {
            '200': { description: 'List of teachers' },
            '404': { description: 'Subject not found' },
          },
        },
      },
    },
  };
}
