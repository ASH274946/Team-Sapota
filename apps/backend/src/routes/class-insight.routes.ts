import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { generateProactiveInsights, listReports, getAssignedClasses, getDashboardInsights } from '../controllers/class-insight.controller';

const router = Router();

router.use(authenticate);

router.get('/classes', authorize(['TEACHER', 'FACULTY', 'ADMIN']), asyncHandler(getAssignedClasses));
router.get('/dashboard', authorize(['TEACHER', 'FACULTY', 'ADMIN']), asyncHandler(getDashboardInsights));
router.post('/class', authorize(['TEACHER', 'FACULTY', 'ADMIN']), asyncHandler(generateProactiveInsights));
router.get('/reports', authorize(['TEACHER', 'FACULTY', 'ADMIN']), asyncHandler(listReports));

export default router;

