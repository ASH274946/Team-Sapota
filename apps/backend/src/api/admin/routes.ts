import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRole } from '../../security/role.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/async-handler';
import {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  updateSystemSettingsSchema,
  idParamSchema,
  paginationQuerySchema,
} from './validators';
import {
  getDashboard,
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  changeUserRole,
  listOrganizations,
  createOrganization,
  updateOrganization,
  getAuditLogs,
  getSystemSettings,
  updateSystemSettings,
  getSubscriptions,
  getPlatformUsage,
} from './controller';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', asyncHandler(getDashboard));

router.get('/users', validate(paginationQuerySchema), asyncHandler(listUsers));
router.post('/users', validate(createUserSchema), asyncHandler(createUser));
router.put('/users/:id', validate(updateUserSchema), asyncHandler(updateUser));
router.delete('/users/:id', validate(idParamSchema), asyncHandler(deactivateUser));
router.put('/users/:id/role', validate(changeRoleSchema), asyncHandler(changeUserRole));

router.get('/organizations', asyncHandler(listOrganizations));
router.post('/organizations', validate(createOrganizationSchema), asyncHandler(createOrganization));
router.put('/organizations/:id', validate(updateOrganizationSchema), asyncHandler(updateOrganization));

router.get('/audit-logs', validate(paginationQuerySchema), asyncHandler(getAuditLogs));

router.get('/system/settings', asyncHandler(getSystemSettings));
router.put('/system/settings', validate(updateSystemSettingsSchema), asyncHandler(updateSystemSettings));

router.get('/subscriptions', asyncHandler(getSubscriptions));
router.get('/usage', asyncHandler(getPlatformUsage));

export default router;
