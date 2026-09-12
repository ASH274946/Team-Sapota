import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../security/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { exportTypeParamSchema, trendQuerySchema } from './validators';
import {
  getDashboard,
  getAssignmentAnalytics,
  getQuizAnalytics,
  getStudentPerformance,
  getTeacherPerformance,
  getUsageStats,
  getAiUsage,
  getTrends,
  exportAnalytics,
} from './controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', asyncHandler(getDashboard));
router.get('/assignments', asyncHandler(getAssignmentAnalytics));
router.get('/quizzes', asyncHandler(getQuizAnalytics));
router.get('/students', asyncHandler(getStudentPerformance));
router.get('/teachers', asyncHandler(getTeacherPerformance));
router.get('/usage', asyncHandler(getUsageStats));
router.get('/ai-usage', asyncHandler(getAiUsage));
router.get('/trends', validate(trendQuerySchema), asyncHandler(getTrends));
router.get('/export/:type', validate(exportTypeParamSchema), requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(exportAnalytics));

export default router;
