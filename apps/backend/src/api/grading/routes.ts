import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../security/role.middleware';
import {
  saveGradingConfig,
  getGradingConfig,
  listSubmissionsForGrading,
  evaluateSubmissionById,
  getEvaluationResult,
  overrideGrade,
  bulkEvaluate,
  getBulkEvaluateJobStatus,
} from './controller';
import {
  assignmentIdParamSchema,
  submissionIdParamSchema,
  jobIdParamSchema,
  createGradingConfigSchema,
  gradeOverrideSchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.post('/config/:assignmentId', requireRole('ADMIN', 'TEACHER'), validate(assignmentIdParamSchema.merge(createGradingConfigSchema)), asyncHandler(saveGradingConfig));
router.get('/config/:assignmentId', requireRole('ADMIN', 'TEACHER'), validate(assignmentIdParamSchema), asyncHandler(getGradingConfig));
router.get('/submissions/:assignmentId', requireRole('ADMIN', 'TEACHER'), validate(assignmentIdParamSchema), asyncHandler(listSubmissionsForGrading));
router.post('/submissions/:submissionId/evaluate', requireRole('ADMIN', 'TEACHER'), validate(submissionIdParamSchema), asyncHandler(evaluateSubmissionById));
router.get('/submissions/:submissionId/evaluation', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(submissionIdParamSchema), asyncHandler(getEvaluationResult));
router.post('/submissions/:submissionId/override', requireRole('ADMIN', 'TEACHER'), validate(gradeOverrideSchema), asyncHandler(overrideGrade));
router.post('/bulk-evaluate/:assignmentId', requireRole('ADMIN', 'TEACHER'), validate(assignmentIdParamSchema), asyncHandler(bulkEvaluate));
router.get('/bulk-evaluate/:jobId', requireRole('ADMIN', 'TEACHER'), validate(jobIdParamSchema), asyncHandler(getBulkEvaluateJobStatus));

export default router;
