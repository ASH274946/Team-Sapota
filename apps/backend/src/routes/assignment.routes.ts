import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { paperGenerationRateLimiter, uploadRateLimiter } from '../middlewares/rate-limit.middleware';
import { authenticate, requireOwnership, requireOrganizationScope } from '../middlewares/auth.middleware';
import fs from 'fs';
import {
  createAssignmentHandler,
  generateAssignmentHandler,
  listAssignmentsHandler,
  getAssignmentHandler,
  deleteAssignmentHandler,
  submitAssignmentForApproval,
  approveAssignment,
  rejectAssignment,
  publishAssignment,
  getAssignmentHistoryHandler,
  updateAssignmentHandler,
} from '../controllers/assignment.controller';
import { requirePermission } from '../security/access-control';

const router = Router();

router.use(authenticate);
router.use(requireOrganizationScope());

// GET /api/assignments
router.get('/', requirePermission('VIEW_ASSIGNMENT'), asyncHandler(listAssignmentsHandler));

// POST /api/assignments  (with optional file uploads)
router.post(
  '/',
  requirePermission('CREATE_ASSIGNMENT'),
  uploadMiddleware.array('files', 10),
  asyncHandler(async (req, res, next) => {
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      let limitTriggered = false;
      await new Promise<void>((resolve) => {
        uploadRateLimiter(req, res, (err) => {
          if (err) {
            limitTriggered = true;
          }
          resolve();
        });
      });

      if (res.headersSent || limitTriggered) {
        const files = req.files as Express.Multer.File[];
        for (const file of files) {
          try {
            fs.unlinkSync(file.path);
          } catch {
            // Ignore unlinking errors
          }
        }
        return;
      }
    }
    next();
  }),
  paperGenerationRateLimiter,
  asyncHandler(createAssignmentHandler)
);

// GET /api/assignments/:id
router.get('/:id', requirePermission('VIEW_ASSIGNMENT'), requireOwnership('Assignment'), asyncHandler(getAssignmentHandler));

// GET /api/assignments/:id/history
router.get('/:id/history', requirePermission('VIEW_ASSIGNMENT'), requireOwnership('Assignment'), asyncHandler(getAssignmentHistoryHandler));

// PUT /api/assignments/:id
router.put('/:id', requirePermission('CREATE_ASSIGNMENT'), requireOwnership('Assignment'), asyncHandler(updateAssignmentHandler));

// DELETE /api/assignments/:id
router.delete('/:id', requirePermission('DELETE_ASSIGNMENT'), requireOwnership('Assignment'), asyncHandler(deleteAssignmentHandler));

// POST /api/assignments/:id/generate
router.post('/:id/generate', requirePermission('GENERATE_PAPER'), requireOwnership('Assignment'), paperGenerationRateLimiter, asyncHandler(generateAssignmentHandler));

// POST /api/assignments/:id/submit
router.post('/:id/submit', requirePermission('SUBMIT_FOR_APPROVAL'), requireOwnership('Assignment'), asyncHandler(submitAssignmentForApproval));

// POST /api/assignments/:id/approve
router.post('/:id/approve', requirePermission('APPROVE_PAPER'), asyncHandler(approveAssignment));

// POST /api/assignments/:id/reject
router.post('/:id/reject', requirePermission('REJECT_PAPER'), asyncHandler(rejectAssignment));

// POST /api/assignments/:id/publish
router.post('/:id/publish', requirePermission('PUBLISH_PAPER'), asyncHandler(publishAssignment));

export default router;
