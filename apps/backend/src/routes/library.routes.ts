import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate, requireOrganizationScope } from '../middlewares/auth.middleware';
import { requireRole } from '../security/role.middleware';
import {
  uploadResource,
  getResources,
  updateResource,
  deleteResource,
  downloadResource,
  viewResource
} from '../controllers/library.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

// Public routes (No authentication required)
router.get('/:id/download', asyncHandler(downloadResource));
router.get('/:id/view', asyncHandler(viewResource));

router.use(authenticate);
router.use(requireOrganizationScope());

// Faculty can manage their library resources
router.post('/', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), uploadMiddleware.single('file'), asyncHandler(uploadResource));
router.get('/', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), asyncHandler(getResources));
router.put('/:id', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), asyncHandler(updateResource));
router.delete('/:id', requireRole('TEACHER', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'), asyncHandler(deleteResource));

export default router;
