import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { authenticate, requireOrganizationScope } from '../middlewares/auth.middleware';
import { requireRole } from '../security/role.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';
import * as StudentController from '../controllers/student.controller';

const router = Router();

router.use(authenticate);
router.use(requireOrganizationScope());
router.use(requireRole('STUDENT'));

router.get('/dashboard', asyncHandler(StudentController.getDashboard));
router.get('/stats', asyncHandler(StudentController.getStats));
router.get('/lessons', asyncHandler(StudentController.getMyLessons));
router.get('/lessons/:id', asyncHandler(StudentController.getLessonDetail));
router.get('/assessments', asyncHandler(StudentController.getMyAssessments));
router.get('/assessments/upcoming', asyncHandler(StudentController.getUpcomingAssessments));
router.post('/assessments/:id/start', asyncHandler(StudentController.startAssessment));
router.post(
  '/assessments/:id/submit',
  requirePermission(PERMISSIONS.SUBMIT_ASSESSMENT),
  uploadMiddleware.array('files', 1),
  asyncHandler(StudentController.submitAssessment),
);
router.get('/results', asyncHandler(StudentController.getMyResults));
router.get('/results/:id', asyncHandler(StudentController.getResultDetail));
router.post('/reschedule', asyncHandler(StudentController.requestReschedule));

export default router;
