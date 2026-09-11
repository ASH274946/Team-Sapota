import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  generateLessonPlan,
  executeWorkflow,
  listWorkflows,
  analyzeOBE,
  getLessonPlans,
  deleteLessonPlan,
  updateLessonPlan,
  generateTestPaper,
  getTestPapers,
  getTestPaperById,
  deleteTestPaper
} from '../controllers/copilot.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['TEACHER', 'FACULTY', 'ADMIN']));

router.post('/lesson-plan', asyncHandler(generateLessonPlan));
router.get('/lesson-plans', asyncHandler(getLessonPlans));
router.delete('/lesson-plan/:id', asyncHandler(deleteLessonPlan));
router.put('/lesson-plan/:id', asyncHandler(updateLessonPlan));

router.post('/test-paper', asyncHandler(generateTestPaper));
router.get('/test-papers', asyncHandler(getTestPapers));
router.get('/test-paper/:id', asyncHandler(getTestPaperById));
router.delete('/test-paper/:id', asyncHandler(deleteTestPaper));

router.post('/workflow', asyncHandler(executeWorkflow));
router.get('/workflows', asyncHandler(listWorkflows));
router.post('/obe-analysis', asyncHandler(analyzeOBE));

export default router;
