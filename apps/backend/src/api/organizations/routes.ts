import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  createDepartmentSchema,
} from './validators';
import {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deactivateOrganization,
  listDepartments,
  createDepartment,
  getOrganizationUsage,
} from './controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['SUPER_ADMIN', 'ADMIN']), asyncHandler(listOrganizations));
router.get('/:id', asyncHandler(getOrganization));
router.post('/', authorize(['SUPER_ADMIN']), validate(createOrganizationSchema), asyncHandler(createOrganization));
router.put('/:id', authorize(['SUPER_ADMIN', 'ADMIN']), validate(updateOrganizationSchema), asyncHandler(updateOrganization));
router.delete('/:id', authorize(['SUPER_ADMIN']), asyncHandler(deactivateOrganization));
router.get('/:id/departments', asyncHandler(listDepartments));
router.post('/:id/departments', authorize(['SUPER_ADMIN', 'ADMIN']), validate(createDepartmentSchema), asyncHandler(createDepartment));
router.get('/:id/usage', authorize(['SUPER_ADMIN', 'ADMIN']), asyncHandler(getOrganizationUsage));

export default router;
