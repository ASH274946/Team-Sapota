export const notificationPaths = {
  '/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List notifications (paginated)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
      ],
      responses: { '200': { description: 'Paginated list of notifications' } },
    },
  },
  '/notifications/unread-count': {
    get: {
      tags: ['Notifications'],
      summary: 'Get unread notification count',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Unread count' } },
    },
  },
  '/notifications/{id}/read': {
    put: {
      tags: ['Notifications'],
      summary: 'Mark notification as read',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Marked as read' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/notifications/read-all': {
    put: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'All marked as read' } },
    },
  },
  '/notifications/{id}': {
    delete: {
      tags: ['Notifications'],
      summary: 'Delete a notification',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '204': { description: 'Deleted' },
        '404': { description: 'Not found' },
      },
    },
  },
  '/notifications/settings': {
    post: {
      tags: ['Notifications'],
      summary: 'Save notification preferences',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                emailNotifications: { type: 'boolean' },
                pushNotifications: { type: 'boolean' },
                digestFrequency: { type: 'string', enum: ['daily', 'weekly', 'never'] },
                types: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Preferences saved' } },
    },
    get: {
      tags: ['Notifications'],
      summary: 'Get notification preferences',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Preferences' } },
    },
  },
};
