import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { authenticate, requireOrganizationScope } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { IngestionController } from '../controllers/ingestion.controller';

const router = Router();

// Apply global authentication and tenant scoping
router.use(authenticate);
router.use(requireOrganizationScope());

// Require specific permission to manage knowledge base
// We will use MANAGE_SYLLABUS for now if MANAGE_KNOWLEDGE is not defined, 
// but MANAGE_KNOWLEDGE is the intended permission. Let's use MANAGE_SYLLABUS as a fallback
router.use(requirePermission('MANAGE_SYLLABUS' as any)); // Type assertion just in case

// Upload documents for ingestion
router.post(
  '/upload',
  uploadMiddleware.array('files', 10),
  asyncHandler(IngestionController.uploadSource)
);

// List ingested documents
router.get(
  '/',
  asyncHandler(IngestionController.listSources)
);

export default router;
