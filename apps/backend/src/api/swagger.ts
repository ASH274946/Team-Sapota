import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import baseSpec from './common/openapi';

import { getAuthPaths } from './auth/openapi';
import { getOrganizationPaths } from './organizations/openapi';
import { getUserPaths } from './users/openapi';
import { getStudentPaths } from './students/openapi';
import { getTeacherPaths } from './teachers/openapi';
import { getSubjectsOpenApiPaths } from './subjects/openapi';
import { getSyllabusOpenApiPaths } from './syllabus/openapi';
import { getDocumentsOpenApiPaths } from './documents/openapi';
import { getKnowledgeOpenApiPaths } from './knowledge/openapi';
import { getRagOpenApiPaths } from './rag/openapi';
import gradingPaths from './grading/openapi';
import rubricPaths from './rubrics/openapi';
import questionPaperPaths from './question-paper/openapi';
import quizPaths from './quizzes/openapi';
import { tutorPaths } from './tutor/openapi';
import { learningPaths } from './learning/openapi';
import { analyticsPaths } from './analytics/openapi';
import { reportsPaths } from './reports/openapi';
import { adminPaths } from './admin/openapi';
import { notificationPaths } from './notifications/openapi';
import { copilotPaths } from './copilot/openapi';
import { jobsPaths } from './jobs/openapi';
import obePaths from './obe/openapi';

function buildFullSpec() {
  const allPaths = {
    ...getAuthPaths(),
    ...getOrganizationPaths(),
    ...getUserPaths(),
    ...getStudentPaths(),
    ...getTeacherPaths(),
    ...getSubjectsOpenApiPaths(),
    ...getSyllabusOpenApiPaths(),
    ...getDocumentsOpenApiPaths(),
    ...getKnowledgeOpenApiPaths(),
    ...getRagOpenApiPaths(),
    ...gradingPaths,
    ...rubricPaths,
    ...questionPaperPaths,
    ...quizPaths,
    ...tutorPaths,
    ...learningPaths,
    ...analyticsPaths,
    ...reportsPaths,
    ...adminPaths,
    ...notificationPaths,
    ...copilotPaths,
    ...jobsPaths,
    ...obePaths,
  };

  return {
    ...baseSpec,
    paths: allPaths,
  };
}

const swaggerRouter = Router();

const spec = buildFullSpec();

swaggerRouter.use('/', swaggerUi.serve);
swaggerRouter.get('/', swaggerUi.setup(spec, {
  explorer: true,
  customSiteTitle: 'VidyaAI API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

swaggerRouter.get('/spec.json', (_req, res) => {
  res.json(spec);
});

export default swaggerRouter;
