export const adminPaths = {
  '/admin/dashboard': {
    get: {
      tags: ['Admin'],
      summary: 'Get admin dashboard stats',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Dashboard stats' } },
    },
  },
  '/admin/users': {
    get: {
      tags: ['Admin'],
      summary: 'List all users (paginated)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        { $ref: '#/components/parameters/sortParam' },
        { $ref: '#/components/parameters/orderParam' },
        { $ref: '#/components/parameters/searchParam' },
      ],
      responses: { '200': { description: 'Paginated list of users' } },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create user',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', minLength: 6 },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
                phone: { type: 'string' },
                organizationId: { type: 'string', format: 'uuid' },
                departmentId: { type: 'string', format: 'uuid' },
              },
              required: ['email', 'firstName', 'lastName', 'role'],
            },
          },
        },
      },
      responses: { '201': { description: 'User created' } },
    },
  },
  '/admin/users/{id}': {
    put: {
      tags: ['Admin'],
      summary: 'Update user',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/idParam' },
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
                status: { type: 'string' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'User updated' } },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Deactivate user',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/idParam' },
      ],
      responses: { '204': { description: 'User deactivated' } },
    },
  },
  '/admin/users/{id}/role': {
    put: {
      tags: ['Admin'],
      summary: 'Change user role',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/idParam' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { role: { type: 'string' } },
              required: ['role'],
            },
          },
        },
      },
      responses: { '200': { description: 'User role updated' } },
    },
  },
  '/admin/organizations': {
    get: {
      tags: ['Admin'],
      summary: 'List organizations',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'List of organizations' } },
    },
    post: {
      tags: ['Admin'],
      summary: 'Create organization',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                code: { type: 'string' },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
                address: { type: 'string' },
                adminEmail: { type: 'string', format: 'email' },
              },
              required: ['name', 'code'],
            },
          },
        },
      },
      responses: { '201': { description: 'Organization created' } },
    },
  },
  '/admin/organizations/{id}': {
    put: {
      tags: ['Admin'],
      summary: 'Update organization',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/idParam' },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                code: { type: 'string' },
                email: { type: 'string', format: 'email' },
                address: { type: 'string' },
                phone: { type: 'string' },
                status: { type: 'string' },
                adminEmail: { type: 'string', format: 'email' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Organization updated' } },
    },
  },
  '/admin/audit-logs': {
    get: {
      tags: ['Admin'],
      summary: 'View audit logs (paginated)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        { $ref: '#/components/parameters/searchParam' },
      ],
      responses: { '200': { description: 'Audit logs' } },
    },
  },
  '/admin/system/settings': {
    get: {
      tags: ['Admin'],
      summary: 'Get system settings',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'System settings' } },
    },
    put: {
      tags: ['Admin'],
      summary: 'Update system settings',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                allowRegistration: { type: 'boolean' },
                maxUploadSizeMb: { type: 'integer' },
                maintenanceMode: { type: 'boolean' },
                defaultLanguage: { type: 'string' },
                features: { type: 'object', additionalProperties: { type: 'boolean' } },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Settings updated' } },
    },
  },
  '/admin/subscriptions': {
    get: {
      tags: ['Admin'],
      summary: 'List subscriptions',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Subscriptions' } },
    },
  },
  '/admin/usage': {
    get: {
      tags: ['Admin'],
      summary: 'Platform usage stats',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Usage stats' } },
    },
  },
};
