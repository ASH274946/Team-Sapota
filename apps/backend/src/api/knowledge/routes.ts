import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  getQualityScores,
  getDocumentQuality,
  triggerEvaluation,
  checkEvaluationJob,
  getChunkQuality,
  generateQualityReport,
} from './controller';
import {
  getQualityScoresSchema,
  getDocumentQualitySchema,
  triggerEvaluationSchema,
  checkEvaluationJobSchema,
  getChunkQualitySchema,
  getReportsSchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.get('/quality', validate(getQualityScoresSchema), asyncHandler(getQualityScores));
router.get('/quality/:documentId', validate(getDocumentQualitySchema), asyncHandler(getDocumentQuality));
router.post('/evaluate', authorize(['ADMIN', 'TEACHER']), validate(triggerEvaluationSchema), asyncHandler(triggerEvaluation));
router.get('/evaluate/:jobId', validate(checkEvaluationJobSchema), asyncHandler(checkEvaluationJob));
router.get('/chunks/:chunkId/quality', validate(getChunkQualitySchema), asyncHandler(getChunkQuality));
router.get('/reports', validate(getReportsSchema), asyncHandler(generateQualityReport));

export default router;
