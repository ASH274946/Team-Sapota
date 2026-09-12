import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';
import { 
  generateNotes, 
  getNotes, 
  getNote, 
  removeNote 
} from '../controllers/notes.controller';

const router = Router();

router.use(authenticate);

router.post('/', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(generateNotes));
router.get('/', asyncHandler(getNotes));
router.get('/:id', asyncHandler(getNote));
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(removeNote));

export default router;
