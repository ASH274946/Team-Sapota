import { Router } from 'express';
import { requestIdMiddleware, requestTimingMiddleware } from './common/middleware';

import metricsRouter from './common/metrics';

import authRouter from './auth/routes';
import organizationsRouter from './organizations/routes';
import usersRouter from './users/routes';
import studentsRouter from './students/routes';
import teachersRouter from './teachers/routes';
import subjectsRouter from './subjects/routes';
import syllabusRouter from './syllabus/routes';
import documentsRouter from './documents/routes';
import knowledgeRouter from './knowledge/routes';
import ragRouter from './rag/routes';
import gradingRouter from './grading/routes';
import rubricsRouter from './rubrics/routes';
import questionPaperRouter from './question-paper/routes';
import quizzesRouter from './quizzes/routes';
import tutorRouter from './tutor/routes';
import learningRouter from './learning/routes';
import analyticsRouter from './analytics/routes';
import reportsRouter from './reports/routes';
import adminRouter from './admin/routes';
import notificationsRouter from './notifications/routes';
import copilotRouter from './copilot/routes';
import jobsRouter from './jobs/routes';
import obeRouter from './obe/routes';
import storageRouter from './storage/routes';

const apiGateway = Router();

apiGateway.use(requestIdMiddleware);
apiGateway.use(requestTimingMiddleware);

// API versioning headers
apiGateway.use((_req, res, next) => {
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-API-Deprecated', 'false');
  next();
});

apiGateway.use('/auth', authRouter);
apiGateway.use('/organizations', organizationsRouter);
apiGateway.use('/users', usersRouter);
apiGateway.use('/students', studentsRouter);
apiGateway.use('/teachers', teachersRouter);
apiGateway.use('/subjects', subjectsRouter);
apiGateway.use('/syllabus', syllabusRouter);
apiGateway.use('/documents', documentsRouter);
apiGateway.use('/knowledge', knowledgeRouter);
apiGateway.use('/rag', ragRouter);
apiGateway.use('/grading', gradingRouter);
apiGateway.use('/rubrics', rubricsRouter);
apiGateway.use('/question-paper', questionPaperRouter);
apiGateway.use('/quizzes', quizzesRouter);
apiGateway.use('/tutor', tutorRouter);
apiGateway.use('/learning', learningRouter);
apiGateway.use('/analytics', analyticsRouter);
apiGateway.use('/reports', reportsRouter);
apiGateway.use('/admin', adminRouter);
apiGateway.use('/notifications', notificationsRouter);
apiGateway.use('/copilot', copilotRouter);
apiGateway.use('/jobs', jobsRouter);
apiGateway.use('/obe', obeRouter);
apiGateway.use('/storage', storageRouter);
apiGateway.use(metricsRouter);



export default apiGateway;
