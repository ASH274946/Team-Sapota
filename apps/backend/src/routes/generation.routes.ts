import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { generateQuestion, generateQuestions, saveQuizSession, getQuizSessionById, updateQuizSession, getQuizHistory, clearQuizHistory, parseDocument, shareQuiz, getSharedQuiz } from '../controllers/generation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { quizGenerationRateLimiter } from '../middlewares/rate-limit.middleware';
import { checkQuizDailyLimit } from '../middlewares/daily-limit.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);


router.post('/parse', uploadMiddleware.any(), asyncHandler(parseDocument));
router.post('/share', asyncHandler(shareQuiz));
router.get('/shared/:id', asyncHandler(getSharedQuiz));

router.post('/question', quizGenerationRateLimiter, checkQuizDailyLimit, asyncHandler(generateQuestion));
router.post('/questions', quizGenerationRateLimiter, checkQuizDailyLimit, asyncHandler(generateQuestions));
router.post('/session', asyncHandler(saveQuizSession));
router.get('/session/:id', asyncHandler(getQuizSessionById));
router.put('/session/:id', asyncHandler(updateQuizSession));
router.get('/history', asyncHandler(getQuizHistory));
router.delete('/history', asyncHandler(clearQuizHistory));

export default router;
