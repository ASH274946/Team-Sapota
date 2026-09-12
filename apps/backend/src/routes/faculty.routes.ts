import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

const router = Router();

router.use(authenticate);
router.use(authorize(['FACULTY']));

// Faculty Dashboard Stats
router.get('/dashboard/stats', asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const orgId = req.user?.organizationId || undefined;

  const [totalTeachers, totalStudents, activeClasses, ongoingExams] = await Promise.all([
    prisma.user.count({
      where: { role: 'TEACHER', organizationId: orgId },
    }),
    prisma.user.count({
      where: { role: 'STUDENT', organizationId: orgId },
    }),
    prisma.class.count({
      where: { organizationId: orgId },
    }),
    prisma.assignment.count({
      where: { status: 'ACTIVE', organizationId: orgId },
    }),
  ]);

  const averageAttendance = 88; // Placeholder
  const departmentPerformance = 'Very Good'; // Placeholder

  res.json({
    success: true,
    data: {
      totalTeachers,
      totalStudents,
      activeClasses,
      averageAttendance,
      departmentPerformance,
      ongoingExams,
    },
  });
}));

export default router;
