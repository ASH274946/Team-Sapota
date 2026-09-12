import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createUserSchema, updateUserSchema, changeUserRoleSchema } from './validators';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  changeUserRole,
  getUserPermissions,
} from './controller';

const router = Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN', 'ADMIN']));

router.get('/', asyncHandler(listUsers));
router.get('/:id', asyncHandler(getUser));
router.post('/', validate(createUserSchema), asyncHandler(createUser));
router.put('/:id', validate(updateUserSchema), asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deactivateUser));
router.put('/:id/role', validate(changeUserRoleSchema), asyncHandler(changeUserRole));
router.get('/:id/permissions', asyncHandler(getUserPermissions));

export default router;
