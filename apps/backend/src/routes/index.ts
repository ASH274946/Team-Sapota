import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { isRedisConnected, isBullRedisConnected } from '../config/redis';
import { getActiveAiJobCount, getStalledAiJobCount } from '../workers/aiGeneration.worker';
import assignmentRoutes from './assignment.routes';
import paperRoutes from './paper.routes';
import questionRoutes from './question.routes';
import reviewRoutes from './review.routes';
import assessmentRoutes from './assessment.routes';
import analyticsRoutes from './analytics.routes';
import exportRoutes from './export.routes';
import authRoutes from './auth.routes';
import groupRoutes from './group.routes';
import generationRoutes from './generation.routes';
import syllabusRoutes from './syllabus.routes';
import graderRoutes from './grader.routes';
import lessonRoutes from './lessons.routes';
import worksheetRoutes from './worksheets.routes';
import tutorRoutes from './tutor.routes';
import notesRoutes from './notes.routes';
import adminRoutes from './admin.routes';
import superAdminRoutes from './super-admin.routes';
import studentRoutes from './student.routes';
import teacherRoutes from './teacher.routes';
import facultyRoutes from './faculty.routes';
import communityRoutes from './community.routes';
import chatRoutes from './chat.routes';
import voiceRoutes from './voice.routes';
import moderationRoutes from './moderation.routes';
import meetingRoutes from './meeting.routes';
import attendanceRoutes from './attendance.routes';
import copilotRoutes from './copilot.routes';
import libraryRoutes from './library.routes';
import classInsightRoutes from './class-insight.routes';
import ingestionRoutes from './ingestion.routes';

// ── New API Gateway ──
import apiGateway from '../api/index';
import swaggerRouter from '../api/swagger';

const apiRouter = Router();


// ── Health check endpoints ──

apiRouter.get('/health/redis', asyncHandler(async (_req, res) => {
  const redisOk = isRedisConnected();
  const bullRedisOk = isBullRedisConnected();
  const ok = redisOk && bullRedisOk;
  res.status(ok ? 200 : 503).json({
    success: ok,
    redis: { status: redisOk ? 'connected' : 'disconnected' },
    bullmq: { status: bullRedisOk ? 'connected' : 'disconnected' },
  });
}));

apiRouter.get('/health/queue', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    activeJobs: getActiveAiJobCount(),
    stalledJobs: getStalledAiJobCount(),
  });
}));

apiRouter.get('/health/providers', asyncHandler(async (_req, res) => {
  res.json({ success: true });
}));

// ── New API Gateway (v1) ──
apiRouter.use('/v1', apiGateway);

// ── Swagger / OpenAPI Documentation ──
apiRouter.use('/v1/docs', swaggerRouter);
apiRouter.use('/docs', swaggerRouter);

// ── Legacy routes (kept for backward compatibility) ──

// Versioned API routes (legacy style)
apiRouter.use('/v1/assignments', assignmentRoutes);
apiRouter.use('/v1/papers', paperRoutes);
apiRouter.use('/v1/questions', questionRoutes);
apiRouter.use('/v1/reviews', reviewRoutes);
apiRouter.use('/v1/assessments', assessmentRoutes);
apiRouter.use('/v1/analytics', analyticsRoutes);
apiRouter.use('/v1/exports', exportRoutes);

// Auth, groups, and generation
apiRouter.use('/v1/auth', authRoutes);
apiRouter.use('/v1/groups', groupRoutes);
apiRouter.use('/v1/generate', generationRoutes);
apiRouter.use('/v1/syllabus', syllabusRoutes);
apiRouter.use('/v1/grader', graderRoutes);
apiRouter.use('/v1/lessons', lessonRoutes);
apiRouter.use('/v1/worksheets', worksheetRoutes);
apiRouter.use('/v1/tutor', tutorRoutes);
apiRouter.use('/v1/notes', notesRoutes);
apiRouter.use('/v1/admin', adminRoutes);
apiRouter.use('/v1/super-admin', superAdminRoutes);
apiRouter.use('/v1/teacher', teacherRoutes);
apiRouter.use('/v1/faculty', facultyRoutes);
apiRouter.use('/v1/student', studentRoutes);
apiRouter.use('/v1/attendance', attendanceRoutes);
apiRouter.use('/v1/library', libraryRoutes);
apiRouter.use('/v1/insights', classInsightRoutes);
apiRouter.use('/v1/ingestion', ingestionRoutes);

// Copilot
apiRouter.use('/v1/copilot', copilotRoutes);

// Backward compatible legacy aliases (deprecated — use /v1/ prefix)
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/papers', paperRoutes);
apiRouter.use('/questions', questionRoutes);

// Community Hub
apiRouter.use('/v1/community', communityRoutes);
apiRouter.use('/v1/chat', chatRoutes);
apiRouter.use('/v1/voice', voiceRoutes);
apiRouter.use('/v1/meetings', meetingRoutes);
apiRouter.use('/v1/admin/community', moderationRoutes);

export default apiRouter;

