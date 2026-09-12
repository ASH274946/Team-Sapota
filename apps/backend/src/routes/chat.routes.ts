import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import * as ChatController from '../controllers/chat.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['STUDENT', 'ADMIN', 'SUPER_ADMIN']));

router.get('/conversations', asyncHandler(ChatController.getConversations));
router.get('/users', asyncHandler(ChatController.getOrgUsers));
router.get('/messages/:conversationId', asyncHandler(ChatController.getMessages));
router.post('/messages', asyncHandler(ChatController.sendMessage));

export default router;
