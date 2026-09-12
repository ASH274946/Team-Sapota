import type { OpenAPIV3 } from 'openapi-types';

export function getUserPaths(): Record<string, OpenAPIV3.PathItemObject> {
  return {
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (paginated)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/sortParam' },
          { $ref: '#/components/parameters/orderParam' },
          { $ref: '#/components/parameters/searchParam' },
        ],
        responses: {
          '200': { description: 'Paginated list of users' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'firstName', 'lastName', 'role'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string' },
                  phone: { type: 'string' },
                  departmentId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'User details' },
          '404': { description: 'Not found' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  role: { type: 'string' },
                  status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'User updated' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Deactivate user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'User deactivated' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: 'Change user role',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Role updated' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/users/{id}/permissions': {
      get: {
        tags: ['Users'],
        summary: 'Get user permissions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'User permissions' },
          '404': { description: 'Not found' },
        },
      },
    },
  };
}
