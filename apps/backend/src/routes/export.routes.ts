import { Router } from 'express';
import { exportAssessmentPdf } from '../controllers/export.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Allow authenticated users to export PDF
router.get('/:assessmentId/pdf', exportAssessmentPdf);

export default router;
