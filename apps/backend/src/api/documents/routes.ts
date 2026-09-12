import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadMiddleware } from '../../middlewares/upload.middleware';
import { uploadRateLimiter } from '../../middlewares/rate-limit.middleware';
import {
  uploadDocument,
  parseDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  processDocument,
  checkDocumentJob,
} from './controller';
import {
  parseDocumentSchema,
  processDocumentSchema,
  listDocumentsSchema,
  documentIdParamSchema,
  checkJobStatusSchema,
  deleteDocumentSchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadRateLimiter, uploadMiddleware.single('file'), asyncHandler(uploadDocument));
router.post('/parse', validate(parseDocumentSchema), asyncHandler(parseDocument));
router.get('/', validate(listDocumentsSchema), asyncHandler(listDocuments));
router.get('/:id', validate(documentIdParamSchema), asyncHandler(getDocument));
router.delete('/:id', validate(deleteDocumentSchema), asyncHandler(deleteDocument));
router.post('/:id/process', validate(processDocumentSchema), asyncHandler(processDocument));
router.get('/:id/jobs/:jobId', validate(checkJobStatusSchema), asyncHandler(checkDocumentJob));

export default router;
