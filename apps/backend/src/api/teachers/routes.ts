import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import {
  listTeachers,
  getTeacher,
  getTeacherAssignments,
  getTeacherClasses,
  getTeacherPerformance,
} from './controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'FACULTY']));

router.get('/', asyncHandler(listTeachers));
router.get('/:id', asyncHandler(getTeacher));
router.get('/:id/assignments', asyncHandler(getTeacherAssignments));
router.get('/:id/classes', asyncHandler(getTeacherClasses));
router.get('/:id/performance', asyncHandler(getTeacherPerformance));

export default router;
