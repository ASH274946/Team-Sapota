import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../security/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
  createSessionSchema,
  sendMessageSchema,
  sessionIdParamSchema,
  updateConfigSchema,
} from './validators';
import {
  createSession,
  listSessions,
  getSession,
  sendMessage,
  closeSession,
  deleteSession,
  getConfig,
  updateConfig,
  generateFlashcards,
  restartSession,
} from './controller';

const router = Router();

router.use(authenticate);

router.post('/sessions', validate(createSessionSchema), asyncHandler(createSession));
router.get('/sessions', asyncHandler(listSessions));
router.get('/sessions/:sessionId', validate(sessionIdParamSchema), asyncHandler(getSession));
router.post('/sessions/:sessionId/chat', validate(sendMessageSchema), asyncHandler(sendMessage));
router.get('/sessions/:sessionId/flashcards', validate(sessionIdParamSchema), asyncHandler(generateFlashcards));
router.patch('/sessions/:sessionId/close', validate(sessionIdParamSchema), asyncHandler(closeSession));
router.patch('/sessions/:sessionId/restart', validate(sessionIdParamSchema), asyncHandler(restartSession));
router.delete('/sessions/:sessionId', validate(sessionIdParamSchema), asyncHandler(deleteSession));

router.get('/config', asyncHandler(getConfig));
router.put('/config', validate(updateConfigSchema), requireRole('ADMIN', 'SUPER_ADMIN'), asyncHandler(updateConfig));

export default router;
