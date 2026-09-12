import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import * as VoiceController from '../controllers/voice.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['STUDENT', 'TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN']));

router.post('/rooms', asyncHandler(VoiceController.createVoiceRoom));
router.get('/rooms', asyncHandler(VoiceController.getActiveRooms));
router.get('/rooms/:roomName/token', asyncHandler(VoiceController.generateToken));
router.post('/rooms/:roomId/join', asyncHandler(VoiceController.joinRoom));
router.post('/rooms/:roomId/leave', asyncHandler(VoiceController.leaveRoom));
router.post('/rooms/:roomId/close', asyncHandler(VoiceController.closeRoom));

export default router;
