import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import { jobIdParamSchema, listJobsQuerySchema } from './validators';
import {
  getJob,
  listJobs,
  cancelJob,
  getJobLogs,
  cleanUpJob,
} from './controller';

const router = Router();

router.use(authenticate);

router.get('/', validate(listJobsQuerySchema), asyncHandler(listJobs));
router.get('/:jobId', validate(jobIdParamSchema), asyncHandler(getJob));
router.post('/:jobId/cancel', validate(jobIdParamSchema), asyncHandler(cancelJob));
router.get('/:jobId/logs', validate(jobIdParamSchema), asyncHandler(getJobLogs));
router.delete('/:jobId', validate(jobIdParamSchema), asyncHandler(cleanUpJob));

export default router;
