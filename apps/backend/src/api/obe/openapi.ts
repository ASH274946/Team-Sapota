const obePaths = {
  '/obe/courses': {
    get: {
      tags: ['OBE'],
      summary: 'List courses for the organization',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'List of courses' } },
    },
    post: {
      tags: ['OBE'],
      summary: 'Create a course',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Course created' } },
    },
  },
  '/obe/courses/{courseId}': {
    get: {
      tags: ['OBE'],
      summary: 'Get curriculum graph for a course',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'courseId', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { '200': { description: 'Curriculum graph' } },
    },
  },
  '/obe/blueprints/{id}/approve': {
    post: {
      tags: ['OBE'],
      summary: 'Approve a blueprint',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: { '200': { description: 'Blueprint approved' } },
    },
  },
};

export default obePaths;
