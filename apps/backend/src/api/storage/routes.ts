import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadMiddleware } from '../../middlewares/upload.middleware';
import { uploadRateLimiter } from '../../middlewares/rate-limit.middleware';
import {
  presignUpload,
  directUpload,
  getFileAccess,
  getFileByKey,
  deleteFile,
  listFiles,
} from './controller';
import {
  presignUploadSchema,
  getFileAccessSchema,
  getFileByKeySchema,
} from './validators';

const router = Router();

router.use(authenticate);

// 1. Presign Upload endpoint for direct client-to-R2 upload
router.post('/presign-upload', uploadRateLimiter, validate(presignUploadSchema), asyncHandler(presignUpload));

// 2. Direct server-mediated upload to R2
router.post('/upload', uploadRateLimiter, uploadMiddleware.single('file'), asyncHandler(directUpload));

// 3. Authenticated file access by ID (returns presigned R2 download URL)
router.get('/:id/access', validate(getFileAccessSchema), asyncHandler(getFileAccess));

// 4. Authenticated file access by object key (returns presigned R2 download URL)
router.get('/by-key', validate(getFileByKeySchema), asyncHandler(getFileByKey));

// 5. Delete file by ID
router.delete('/:id', validate(getFileAccessSchema), asyncHandler(deleteFile));

// 6. List files with RBAC filtering
router.get('/', asyncHandler(listFiles));

export default router;
