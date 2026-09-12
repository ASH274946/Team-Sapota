import { Router } from 'express';
import { 
  getDashboardStats, 
  getStudentStats, 
  getGroupStats, 
  triggerRecommendations 
} from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(authenticate);

import prisma from '../config/prisma';

// All authenticated users can view their relevant dashboard stats
router.get('/stats', asyncHandler(getDashboardStats));
router.get('/student/:studentId', asyncHandler(getStudentStats));
router.get('/group/:groupId', asyncHandler(getGroupStats));

// New endpoint for fetching classes (groups) for analytics
router.get('/groups', asyncHandler(async (req, res) => {
  const orgId = req.user?.organizationId;
  if (!orgId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const classes = await prisma.class.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { students: true } }
    }
  });
  
  res.json({
    success: true,
    data: classes.map(c => ({
      id: c.id,
      name: `${c.grade}-${c.section} (${c.academicYear})`,
      subject: 'General',
      students: c._count.students,
    }))
  });
}));
router.post('/recommendations', asyncHandler(triggerRecommendations));

export default router;
