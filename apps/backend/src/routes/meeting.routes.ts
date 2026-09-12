import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import * as MeetingController from '../controllers/meeting.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['STUDENT', 'ADMIN', 'SUPER_ADMIN']));

router.get('/', asyncHandler(MeetingController.getMeetings));
router.post('/', asyncHandler(MeetingController.createMeeting));

export default router;
