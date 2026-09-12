import type { OpenAPIV3 } from 'openapi-types';

const openapiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'VidyaAI API',
    version: '1.0.0',
    description: 'Complete API Gateway for the VidyaAI Education Platform. Exposes all AI-powered capabilities through secure, versioned endpoints.',
    contact: {
      name: 'VidyaAI Support',
      email: 'support@vidyaai.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token obtained from /auth/login or /auth/signup',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'JWT access token stored in HttpOnly cookie',
      },
    },
    schemas: {
      ApiSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'OK' },
          data: { type: 'object' },
          meta: { type: 'object', nullable: true },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
          requestId: { type: 'string', format: 'uuid' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errorCode: { type: 'string' },
          details: { type: 'object', nullable: true },
          traceId: { type: 'string', format: 'uuid' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      JobStatus: {
        type: 'object',
        properties: {
          jobId: { type: 'string' },
          status: { type: 'string', enum: ['queued', 'processing', 'completed', 'failed'] },
          progress: { type: 'number', nullable: true },
          resultUrl: { type: 'string', nullable: true },
          error: { type: 'string', nullable: true },
          estimatedCompletion: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      IdResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
    parameters: {
      pageParam: {
        in: 'query',
        name: 'page',
        schema: { type: 'integer', default: 1 },
        description: 'Page number (1-indexed)',
      },
      limitParam: {
        in: 'query',
        name: 'limit',
        schema: { type: 'integer', default: 20 },
        description: 'Items per page (max 100)',
      },
      sortParam: {
        in: 'query',
        name: 'sort',
        schema: { type: 'string', default: 'createdAt' },
        description: 'Field to sort by',
      },
      orderParam: {
        in: 'query',
        name: 'order',
        schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        description: 'Sort order',
      },
      searchParam: {
        in: 'query',
        name: 'search',
        schema: { type: 'string' },
        description: 'Search term for full-text search',
      },
      idParam: {
        in: 'path',
        name: 'id',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Resource ID',
      },
    },
  },
  security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication & user management' },
    { name: 'Organizations', description: 'Organization management' },
    { name: 'Users', description: 'User management' },
    { name: 'Students', description: 'Student management' },
    { name: 'Teachers', description: 'Teacher management' },
    { name: 'Subjects', description: 'Subject management' },
    { name: 'Syllabus', description: 'Syllabus management' },
    { name: 'Documents', description: 'Document ingestion & OCR' },
    { name: 'Knowledge', description: 'Knowledge quality engine' },
    { name: 'RAG', description: 'Hybrid RAG retrieval' },
    { name: 'Grading', description: 'AI grading & evaluation' },
    { name: 'Rubrics', description: 'Rubric management' },
    { name: 'Question Bank', description: 'Question bank management' },
    { name: 'Question Paper', description: 'Question paper generation' },
    { name: 'Quizzes', description: 'Quiz engine' },
    { name: 'Tutor', description: 'AI Tutor conversations' },
    { name: 'Learning', description: 'Student learning intelligence' },
    { name: 'Analytics', description: 'Analytics & insights' },
    { name: 'Reports', description: 'Report generation' },
    { name: 'Admin', description: 'Administrative operations' },
    { name: 'Notifications', description: 'Notification management' },
    { name: 'Copilot', description: 'Teacher AI Copilot' },
    { name: 'Jobs', description: 'Async job management' },
  ],
  paths: {},
};

export function createOpenapiSpec(additionalPaths: Record<string, OpenAPIV3.PathItemObject> = {}): OpenAPIV3.Document {
  return {
    ...openapiSpec,
    paths: {
      ...openapiSpec.paths,
      ...additionalPaths,
    },
  };
}

export default openapiSpec;
