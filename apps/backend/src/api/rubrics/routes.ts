import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../security/role.middleware';
import {
  listRubrics,
  createRubric,
  getRubric,
  updateRubric,
  deleteRubric,
  duplicateRubric,
  exportRubric,
  importRubric,
} from './controller';
import {
  idParamSchema,
  exportIdParamSchema,
  createRubricSchema,
  updateRubricSchema,
  importRubricSchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('ADMIN', 'TEACHER'), asyncHandler(listRubrics));
router.post('/', requireRole('ADMIN', 'TEACHER'), validate(createRubricSchema), asyncHandler(createRubric));
router.get('/:id', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(getRubric));
router.put('/:id', requireRole('ADMIN', 'TEACHER'), validate(updateRubricSchema), asyncHandler(updateRubric));
router.delete('/:id', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(deleteRubric));
router.post('/:id/duplicate', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(duplicateRubric));
router.get('/export/:id', requireRole('ADMIN', 'TEACHER'), validate(exportIdParamSchema), asyncHandler(exportRubric));
router.post('/import', requireRole('ADMIN', 'TEACHER'), validate(importRubricSchema), asyncHandler(importRubric));

export default router;
