import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../security/role.middleware';
import { paperGenerationRateLimiter } from '../../middlewares/rate-limit.middleware';
import {
  generatePaper,
  checkGenerationJob,
  listPapers,
  getPaperById,
  deletePaper,
  publishPaper,
  archivePaper,
  getPaperDownloadUrl,
  getAnswerKey,
} from './controller';
import {
  idParamSchema,
  jobIdParamSchema,
  generatePaperSchema,
  listPapersQuerySchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.post('/generate', requireRole('ADMIN', 'TEACHER'), paperGenerationRateLimiter, validate(generatePaperSchema), asyncHandler(generatePaper));
router.get('/generate/:jobId', requireRole('ADMIN', 'TEACHER'), validate(jobIdParamSchema), asyncHandler(checkGenerationJob));
router.get('/', requireRole('ADMIN', 'TEACHER'), validate(listPapersQuerySchema), asyncHandler(listPapers));
router.get('/:id', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(idParamSchema), asyncHandler(getPaperById));
router.delete('/:id', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(deletePaper));
router.post('/:id/publish', requireRole('ADMIN'), validate(idParamSchema), asyncHandler(publishPaper));
router.post('/:id/archive', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(archivePaper));
router.get('/:id/download', requireRole('ADMIN', 'TEACHER', 'STUDENT'), validate(idParamSchema), asyncHandler(getPaperDownloadUrl));
router.get('/:id/answer-key', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(getAnswerKey));

export default router;
