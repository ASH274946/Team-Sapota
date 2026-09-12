import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  getEligibleStudents,
  getStudents,
  addStudent,
  deleteStudent,
  bulkAddStudents,
} from '../controllers/group.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';

const router = Router();

router.use(authenticate);

// Student roster management
// Note: /eligible-students must come BEFORE /:id routes to avoid being caught as an ID
router.get('/eligible-students', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(getEligibleStudents));

// Group CRUD
router.get('/', asyncHandler(getGroups));
router.post('/', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(createGroup));
router.get('/:id', asyncHandler(getGroup));
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(updateGroup));
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(deleteGroup));

router.get('/:id/students', asyncHandler(getStudents));
router.post('/:id/students', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(addStudent));
router.post('/:id/students/bulk', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(bulkAddStudents));
router.delete('/:id/students/:studentId', requirePermission(PERMISSIONS.MANAGE_GROUPS), asyncHandler(deleteStudent));

export default router;
