import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../security/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
  updateProfileSchema,
  studentIdParamSchema,
  identifyAtRiskSchema,
  jobIdParamSchema,
} from './validators';
import {
  listProfiles,
  getProfile,
  updateProfile,
  getPredictions,
  refreshProfile,
  getStudyPlans,
  generateStudyPlan,
  getInsights,
  identifyAtRisk,
  getIdentifyAtRiskStatus,
} from './controller';

const router = Router();

router.use(authenticate);

router.get('/profiles', asyncHandler(listProfiles));
router.get('/profiles/:studentId', validate(studentIdParamSchema), asyncHandler(getProfile));
router.get('/students/:studentId/profile', validate(studentIdParamSchema), asyncHandler(getProfile));
router.put('/profiles/:studentId', validate(updateProfileSchema), asyncHandler(updateProfile));
router.get('/profiles/:studentId/predictions', validate(studentIdParamSchema), asyncHandler(getPredictions));
router.post('/profiles/:studentId/refresh', validate(studentIdParamSchema), asyncHandler(refreshProfile));

router.get('/study-plans/:studentId', validate(studentIdParamSchema), asyncHandler(getStudyPlans));
router.get('/students/:studentId/study-plan', validate(studentIdParamSchema), asyncHandler(getStudyPlans));
router.post('/study-plans/:studentId/generate', validate(studentIdParamSchema), asyncHandler(generateStudyPlan));

router.get('/insights/:studentId', validate(studentIdParamSchema), asyncHandler(getInsights));

router.post('/identify-at-risk', validate(identifyAtRiskSchema), requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(identifyAtRisk));
router.get('/identify-at-risk/:jobId', validate(jobIdParamSchema), asyncHandler(getIdentifyAtRiskStatus));

export default router;
