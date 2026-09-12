import { Router } from 'express';
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  checkDuplicateQuestion,
} from '../controllers/question.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';

const router = Router();

// Apply base authentication to all question routes
router.use(authenticate);

// CRUD routes for Questions
router.get('/', getQuestions);
router.get('/:id', getQuestionById);

// VID-14: Multi-tier question duplicate detection check endpoint
router.post('/duplicate-check', checkDuplicateQuestion);

// Only specific roles can create/update/delete
router.post('/', requirePermission('MANAGE_QUESTION_BANK'), createQuestion);
router.put('/:id', requirePermission('MANAGE_QUESTION_BANK'), updateQuestion);
router.delete('/:id', requirePermission('MANAGE_QUESTION_BANK'), deleteQuestion);

export default router;
