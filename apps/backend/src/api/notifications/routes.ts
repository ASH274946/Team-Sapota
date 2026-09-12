import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { notificationIdParamSchema, markReadSchema, savePreferencesSchema } from './validators';
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  savePreferences,
  getPreferences,
} from './controller';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listNotifications));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.put('/:id/read', validate(markReadSchema), asyncHandler(markAsRead));
router.put('/read-all', asyncHandler(markAllAsRead));
router.delete('/:id', validate(notificationIdParamSchema), asyncHandler(deleteNotification));
router.post('/settings', validate(savePreferencesSchema), asyncHandler(savePreferences));
router.get('/settings', asyncHandler(getPreferences));

export default router;
