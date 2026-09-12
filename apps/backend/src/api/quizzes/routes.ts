import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../security/role.middleware';
import { quizGenerationRateLimiter } from '../../middlewares/rate-limit.middleware';
import {
  generateQuiz,
  listSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  getHistory,
  clearHistory,
  shareQuiz,
  getSharedQuiz,
  startAdaptiveQuiz,
  getNextAdaptiveQuestion,
  completeAdaptiveQuiz,
} from './controller';
import {
  idParamSchema,
  sharedIdParamSchema,
  generateQuizSchema,
  createQuizSessionSchema,
  updateQuizSessionSchema,
  deleteQuizSessionSchema,
  shareQuizSchema,
  adaptiveStartSchema,
  adaptiveNextSchema,
  adaptiveCompleteSchema,
  listSessionsQuerySchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.post('/generate', requireRole('ADMIN', 'TEACHER', 'STUDENT'), quizGenerationRateLimiter, validate(generateQuizSchema), asyncHandler(generateQuiz));
router.get('/sessions', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(listSessionsQuerySchema), asyncHandler(listSessions));
router.post('/sessions', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(createQuizSessionSchema), asyncHandler(createSession));
router.get('/history', requireRole('ADMIN', 'TEACHER', 'STUDENT'), asyncHandler(getHistory));
router.delete('/history', requireRole('ADMIN', 'TEACHER', 'STUDENT'), asyncHandler(clearHistory));
router.post('/share', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(shareQuizSchema), asyncHandler(shareQuiz));
router.get('/shared/:id', validate(sharedIdParamSchema), asyncHandler(getSharedQuiz));
router.post('/adaptive/start', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(adaptiveStartSchema), asyncHandler(startAdaptiveQuiz));
router.post('/adaptive/next', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(adaptiveNextSchema), asyncHandler(getNextAdaptiveQuestion));
router.post('/adaptive/complete', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(adaptiveCompleteSchema), asyncHandler(completeAdaptiveQuiz));
router.get('/sessions/:id', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(idParamSchema), asyncHandler(getSession));
router.put('/sessions/:id', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(updateQuizSessionSchema), asyncHandler(updateSession));
router.delete('/sessions/:id', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(deleteQuizSessionSchema), asyncHandler(deleteSession));

export default router;
