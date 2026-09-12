import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  getPaperHandler,
  downloadPdfHandler,
  downloadPdfByAssignmentIdHandler,
  updatePaperHandler,
  regenerateQuestionHandler,
  getPaperJobStatusHandler,
} from '../controllers/paper.controller';
import { authenticate, requireOrganizationScope } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';

const router = Router();

router.use(authenticate);
router.use(requireOrganizationScope());

// GET /api/papers/:assignmentId/pdf
router.get(
  '/:assignmentId/pdf',
  requirePermission(PERMISSIONS.VIEW_PAPER),
  asyncHandler(downloadPdfByAssignmentIdHandler),
);

// GET /api/papers/job/:assignmentId
router.get(
  '/job/:assignmentId',
  requirePermission(PERMISSIONS.VIEW_PAPER),
  asyncHandler(getPaperJobStatusHandler),
);

// GET /api/papers/download/:filename
router.get(
  '/download/:filename',
  requirePermission(PERMISSIONS.VIEW_PAPER),
  asyncHandler(downloadPdfHandler),
);

// GET /api/papers/:assignmentId
router.get(
  '/:assignmentId',
  requirePermission(PERMISSIONS.VIEW_PAPER),
  asyncHandler(getPaperHandler),
);

// PUT /api/papers/:id
router.put(
  '/:id',
  requirePermission(PERMISSIONS.EDIT_ASSIGNMENT),
  asyncHandler(updatePaperHandler),
);

// POST /api/papers/:id/regenerate-question
router.post(
  '/:id/regenerate-question',
  requirePermission(PERMISSIONS.GENERATE_PAPER),
  asyncHandler(regenerateQuestionHandler),
);

export default router;
