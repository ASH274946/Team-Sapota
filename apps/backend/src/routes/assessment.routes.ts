import { Router } from 'express';
import { createAssessment, getAssessments } from '../controllers/assessment.controller';
import { authenticate, requireOrganizationScope } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createAssessmentSchema, getAssessmentsSchema } from '../validators/assessment.validator';
import { requirePermission } from '../security/access-control';

const router = Router();

// Apply base authentication to all assessment routes
router.use(authenticate);
router.use(requireOrganizationScope());

router.get('/', validate(getAssessmentsSchema), getAssessments);
router.post('/', requirePermission('CREATE_ASSIGNMENT'), validate(createAssessmentSchema), createAssessment);

export default router;
