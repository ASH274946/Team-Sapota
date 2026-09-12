import type { OpenAPIV3 } from 'openapi-types';

export function getTeacherPaths(): Record<string, OpenAPIV3.PathItemObject> {
  return {
    '/teachers': {
      get: {
        tags: ['Teachers'],
        summary: 'List teachers',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/sortParam' },
          { $ref: '#/components/parameters/orderParam' },
          { $ref: '#/components/parameters/searchParam' },
          { in: 'query', name: 'departmentId', schema: { type: 'string', format: 'uuid' }, description: 'Filter by department' },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] }, description: 'Filter by status' },
        ],
        responses: {
          '200': { description: 'List of teachers' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/teachers/{id}': {
      get: {
        tags: ['Teachers'],
        summary: 'Get teacher profile',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Teacher profile' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/teachers/{id}/assignments': {
      get: {
        tags: ['Teachers'],
        summary: 'Get teacher assignments',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'List of assignments' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/teachers/{id}/classes': {
      get: {
        tags: ['Teachers'],
        summary: 'Get teacher classes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'List of classes' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/teachers/{id}/performance': {
      get: {
        tags: ['Teachers'],
        summary: 'Get teacher analytics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Teacher performance data' },
          '404': { description: 'Not found' },
        },
      },
    },
  };
}
