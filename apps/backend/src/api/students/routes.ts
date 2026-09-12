import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  listStudents,
  getStudent,
  getStudentProgress,
  getStudentPerformance,
  getStudentQuizzes,
  getStudentSubmissions,
  getStudentLearningProfile,
  getStudentAtRisk,
} from './controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'FACULTY']));

router.get('/', asyncHandler(listStudents));
router.get('/:id', asyncHandler(getStudent));
router.get('/:id/progress', asyncHandler(getStudentProgress));
router.get('/:id/performance', asyncHandler(getStudentPerformance));
router.get('/:id/quizzes', asyncHandler(getStudentQuizzes));
router.get('/:id/submissions', asyncHandler(getStudentSubmissions));
router.get('/:id/learning-profile', asyncHandler(getStudentLearningProfile));
router.get('/:id/at-risk', asyncHandler(getStudentAtRisk));

export default router;
