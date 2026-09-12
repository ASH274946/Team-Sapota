import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';
import {
  generatePlan,
  getPlans,
  getPlan,
  removePlan,
  updatePlan,
  exportLessonPdf,
  getLessonPdfStatus,
} from '../controllers/lessons.controller';

const router = Router();

router.use(authenticate);

// ── Existing routes (unchanged) ────────────────────────────────────────────
router.post('/', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(generatePlan));
router.get('/', asyncHandler(getPlans));
router.get('/:id', asyncHandler(getPlan));
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(updatePlan));
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(removePlan));

// ── Lesson Plan PDF export (VID-5) ─────────────────────────────────────────
/** POST /api/v1/lessons/:id/export-pdf — enqueue BullMQ PDF job, returns { jobId } */
router.post('/:id/export-pdf', asyncHandler(exportLessonPdf));

/** GET /api/v1/lessons/pdf-job/:jobId — poll Redis for job status */
router.get('/pdf-job/:jobId', asyncHandler(getLessonPdfStatus));

export default router;
