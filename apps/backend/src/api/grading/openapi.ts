import { OpenAPIV3 } from 'openapi-types';

const gradingPaths: OpenAPIV3.PathsObject = {
  '/grading/config/{assignmentId}': {
    post: {
      tags: ['Grading'],
      summary: 'Save grading configuration for an assignment',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'assignmentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                answerKeyText: { type: 'string' },
                rubricId: { type: 'string', format: 'uuid' },
                aiModel: { type: 'string' },
                passingScore: { type: 'number' },
                maxAttempts: { type: 'integer' },
                gradingType: { type: 'string', enum: ['AUTO', 'MANUAL', 'HYBRID'] },
              },
              required: ['answerKeyText', 'gradingType'],
            },
          },
        },
      },
      responses: {
        '201': { description: 'Grading config saved' },
        '400': { description: 'Validation error' },
        '403': { description: 'Forbidden' },
        '404': { description: 'Assignment not found' },
      },
    },
    get: {
      tags: ['Grading'],
      summary: 'Get grading configuration for an assignment',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'assignmentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Grading config' },
        '404': { description: 'Config not found' },
      },
    },
  },
  '/grading/submissions/{assignmentId}': {
    get: {
      tags: ['Grading'],
      summary: 'List submissions for grading',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'assignmentId', required: true, schema: { type: 'string', format: 'uuid' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        '200': { description: 'Paginated list of submissions' },
      },
    },
  },
  '/grading/submissions/{submissionId}/evaluate': {
    post: {
      tags: ['Grading'],
      summary: 'Run AI evaluation on a submission',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'submissionId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Evaluation result' },
        '404': { description: 'Submission not found' },
      },
    },
  },
  '/grading/submissions/{submissionId}/evaluation': {
    get: {
      tags: ['Grading'],
      summary: 'Get evaluation result for a submission',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'submissionId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '200': { description: 'Evaluation result' },
        '404': { description: 'Evaluation not found' },
      },
    },
  },
  '/grading/submissions/{submissionId}/override': {
    post: {
      tags: ['Grading'],
      summary: 'Manually override grade for a submission',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'submissionId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                reason: { type: 'string' },
                criteriaGrades: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      criterionId: { type: 'string' },
                      score: { type: 'number' },
                      explanation: { type: 'string' },
                    },
                  },
                },
              },
              required: ['score', 'reason'],
            },
          },
        },
      },
      responses: {
        '200': { description: 'Grade overridden' },
        '403': { description: 'Forbidden' },
      },
    },
  },
  '/grading/bulk-evaluate/{assignmentId}': {
    post: {
      tags: ['Grading'],
      summary: 'Bulk evaluate all pending submissions (async)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'assignmentId', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        '202': { description: 'Bulk evaluation started' },
      },
    },
  },
  '/grading/bulk-evaluate/{jobId}': {
    get: {
      tags: ['Grading'],
      summary: 'Check bulk evaluation job status',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'jobId', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Job status' },
        '404': { description: 'Job not found' },
      },
    },
  },
};

export default gradingPaths;
