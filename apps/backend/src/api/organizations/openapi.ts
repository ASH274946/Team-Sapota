import type { OpenAPIV3 } from 'openapi-types';

export function getOrganizationPaths(): Record<string, OpenAPIV3.PathItemObject> {
  return {
    '/organizations': {
      get: {
        tags: ['Organizations'],
        summary: 'List all organizations',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of organizations' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
      post: {
        tags: ['Organizations'],
        summary: 'Create a new organization',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  adminEmail: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Organization created' },
          '400': { description: 'Validation error' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/organizations/{id}': {
      get: {
        tags: ['Organizations'],
        summary: 'Get organization by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Organization details' },
          '404': { description: 'Not found' },
        },
      },
      put: {
        tags: ['Organizations'],
        summary: 'Update organization',
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
                  name: { type: 'string' },
                  code: { type: 'string' },
                  email: { type: 'string' },
                  address: { type: 'string' },
                  status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Organization updated' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Organizations'],
        summary: 'Deactivate organization',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Organization deactivated' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/organizations/{id}/departments': {
      get: {
        tags: ['Organizations'],
        summary: 'List departments in an organization',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'List of departments' },
        },
      },
      post: {
        tags: ['Organizations'],
        summary: 'Create department in organization',
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
                required: ['name', 'code'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  hodId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Department created' },
          '404': { description: 'Organization not found' },
        },
      },
    },
    '/organizations/{id}/usage': {
      get: {
        tags: ['Organizations'],
        summary: 'Get organization usage statistics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Usage statistics' },
          '404': { description: 'Organization not found' },
        },
      },
    },
  };
}
