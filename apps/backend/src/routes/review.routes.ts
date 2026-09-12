import { Router } from 'express';
import { submitReview, getReviewsForQuestion, getPendingReviews } from '../controllers/review.controller';
import { authenticate, requireOrganizationScope } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';

const router = Router();

router.use(authenticate);
router.use(requireOrganizationScope());

// Only specific roles can review questions
router.get('/pending', requirePermission('APPROVE_PAPER'), getPendingReviews);
router.post('/', requirePermission('APPROVE_PAPER'), submitReview);
router.get('/question/:questionId', requirePermission('APPROVE_PAPER'), getReviewsForQuestion);

export default router;
