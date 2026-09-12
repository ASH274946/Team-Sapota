import type { OpenAPIV3 } from 'openapi-types';

export function getAuthPaths(): Record<string, OpenAPIV3.PathItemObject> {
  return {
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string', enum: ['STUDENT', 'TEACHER'] },
                  organizationId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created' },
          '400': { description: 'Validation error' },
          '409': { description: 'Conflict' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
          '429': { description: 'Too many attempts' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        responses: {
          '200': { description: 'Token refreshed' },
          '401': { description: 'Invalid refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout and revoke refresh token',
        responses: {
          '200': { description: 'Logged out' },
        },
      },
    },
    '/auth/sso': {
      post: {
        tags: ['Auth'],
        summary: 'SSO login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'provider'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  provider: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'SSO login successful' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/auth/accept-invite': {
      post: {
        tags: ['Auth'],
        summary: 'Accept invitation and create account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password', 'firstName', 'lastName'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created' },
          '400': { description: 'Invalid or expired token' },
        },
      },
    },
    '/auth/public-organizations': {
      get: {
        tags: ['Auth'],
        summary: 'List active public organizations',
        responses: {
          '200': { description: 'List of organizations' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User profile' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me/profile': {
      put: {
        tags: ['Auth'],
        summary: 'Update profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  avatar: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me/preferences': {
      put: {
        tags: ['Auth'],
        summary: 'Update user preferences',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['preferences'],
                properties: {
                  preferences: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Preferences updated' },
        },
      },
    },
    '/auth/me/password': {
      put: {
        tags: ['Auth'],
        summary: 'Change password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed' },
          '400': { description: 'Incorrect current password' },
        },
      },
    },
    '/auth/me/sessions': {
      get: {
        tags: ['Auth'],
        summary: 'List active sessions',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of sessions' },
        },
      },
    },
    '/auth/me/sessions/{id}': {
      delete: {
        tags: ['Auth'],
        summary: 'Revoke a session',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Session revoked' },
        },
      },
    },
    '/auth/me/switch-organization': {
      post: {
        tags: ['Auth'],
        summary: 'Switch active organization',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['organizationId'],
                properties: {
                  organizationId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Organization switched' },
          '403': { description: 'Access denied' },
        },
      },
    },
    '/auth/me/organizations': {
      get: {
        tags: ['Auth'],
        summary: 'List organizations for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'List of organizations' },
        },
      },
    },
    '/auth/me/storage': {
      get: {
        tags: ['Auth'],
        summary: 'Get storage usage',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Storage usage info' },
        },
      },
    },
    '/auth/onboarding/complete': {
      post: {
        tags: ['Auth'],
        summary: 'Complete onboarding flow',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Onboarding completed' },
        },
      },
    },
  };
}
