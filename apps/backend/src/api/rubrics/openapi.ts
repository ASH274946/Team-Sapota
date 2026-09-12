import { OpenAPIV3 } from 'openapi-types';

const rubricPaths: OpenAPIV3.PathsObject = {
  '/rubrics': {
    get: {
      tags: ['Rubrics'],
      summary: 'List rubrics (org-scoped)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        { in: 'query', name: 'search', schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Paginated list of rubrics' },
      },
    },
    post: {
      tags: ['Rubrics'],
      summary: 'Create rubric with criteria',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                subject: { type: 'string' },
                criteria: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/RubricCriterion' },
                },
              },
              required: ['title', 'criteria'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Rubric created' },
        '400': { description: 'Validation error' },
      },
    },
  },
  '/rubrics/{id}': {
    get: {
      tags: ['Rubrics'],
      summary: 'Get rubric with criteria',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Rubric details' },
        '404': { description: 'Not found' },
      },
    },
    put: {
      tags: ['Rubrics'],
      summary: 'Update rubric',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
                criteria: { type: 'array', items: { $ref: '#/components/schemas/RubricCriterion' } },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Rubric updated' },
        '404': { description: 'Not found' },
      },
    },
    delete: {
      tags: ['Rubrics'],
      summary: 'Delete rubric',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '204': { description: 'Deleted' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/rubrics/{id}/duplicate': {
    post: {
      tags: ['Rubrics'],
      summary: 'Duplicate rubric',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '201': { description: 'Duplicate created' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/rubrics/export/{id}': {
    get: {
      tags: ['Rubrics'],
      summary: 'Export rubric as JSON',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        '200': { description: 'Rubric JSON export' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/rubrics/import': {
    post: {
      tags: ['Rubrics'],
      summary: 'Import rubric from JSON',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                criteria: { type: 'array', items: { $ref: '#/components/schemas/RubricCriterion' } },
                rawText: { type: 'string' },
              },
              required: ['title'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Rubric imported' },
        '400': { description: 'Validation error' },
      },
    },
  },
};

export default rubricPaths;
