import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import * as ModerationController from '../controllers/moderation.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'SUPER_ADMIN'])); // Strict RBAC for moderation

router.delete('/posts/:id', asyncHandler(ModerationController.deletePost));
router.delete('/messages/:id', asyncHandler(ModerationController.deleteMessage));
router.get('/groups/audit', asyncHandler(ModerationController.auditGroups));
router.delete('/groups/:id', asyncHandler(ModerationController.suspendGroup));

export default router;
