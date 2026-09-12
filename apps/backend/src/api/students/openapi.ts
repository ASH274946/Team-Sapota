import type { OpenAPIV3 } from 'openapi-types';

export function getStudentPaths(): Record<string, OpenAPIV3.PathItemObject> {
  return {
    '/students': {
      get: {
        tags: ['Students'],
        summary: 'List students (paginated, filtered)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/sortParam' },
          { $ref: '#/components/parameters/orderParam' },
          { $ref: '#/components/parameters/searchParam' },
          { in: 'query', name: 'groupId', schema: { type: 'string', format: 'uuid' }, description: 'Filter by group' },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED'] }, description: 'Filter by status' },
        ],
        responses: {
          '200': { description: 'Paginated list of students' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/students/{id}': {
      get: {
        tags: ['Students'],
        summary: 'Get student profile',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Student profile' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/students/{id}/progress': {
      get: {
        tags: ['Students'],
        summary: 'Get student learning progress',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          { in: 'query', name: 'start', schema: { type: 'string', format: 'date-time' } },
          { in: 'query', name: 'end', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': { description: 'Student progress data' },
          '404': { description: 'Student not found' },
        },
      },
    },
    '/students/{id}/performance': {
      get: {
        tags: ['Students'],
        summary: 'Get student performance',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Student performance data' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/students/{id}/quizzes': {
      get: {
        tags: ['Students'],
        summary: 'Get quiz history',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Quiz history' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/students/{id}/submissions': {
      get: {
        tags: ['Students'],
        summary: 'Get student submissions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'List of submissions' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/students/{id}/learning-profile': {
      get: {
        tags: ['Students'],
        summary: 'Get learning intelligence profile',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Learning profile' },
          '404': { description: 'Profile not found' },
        },
      },
    },
    '/students/{id}/at-risk': {
      get: {
        tags: ['Students'],
        summary: 'Check if student is at risk',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'At-risk assessment' },
          '404': { description: 'Not found' },
        },
      },
    },
  };
}
