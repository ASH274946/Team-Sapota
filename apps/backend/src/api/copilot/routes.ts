import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../security/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
  assistSchema,
  generateLessonPlanSchema,
  generateActivitySchema,
  generateWorksheetSchema,
  feedbackSchema,
} from './validators';
import {
  assist,
  generateLessonPlan,
  generateActivity,
  generateWorksheet,
  getHistory,
  submitFeedback,
} from './controller';

const router = Router();

router.use(authenticate);
router.use(requireRole('TEACHER', 'ADMIN', 'SUPER_ADMIN'));

router.post('/assist', validate(assistSchema), asyncHandler(assist));
router.post('/generate-lesson-plan', validate(generateLessonPlanSchema), asyncHandler(generateLessonPlan));
router.post('/generate-activity', validate(generateActivitySchema), asyncHandler(generateActivity));
router.post('/generate-worksheet', validate(generateWorksheetSchema), asyncHandler(generateWorksheet));
router.get('/history', asyncHandler(getHistory));
router.post('/feedback', validate(feedbackSchema), asyncHandler(submitFeedback));

export default router;
