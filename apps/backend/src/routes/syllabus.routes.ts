import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import {
  getSyllabuses,
  getSyllabus,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  updateTopic,
  updateSubtopic,
  addTopic,
} from '../controllers/syllabus.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../security/access-control';
import { PERMISSIONS } from '../security/permissions';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getSyllabuses));
router.get('/:id', asyncHandler(getSyllabus));
router.post('/', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(createSyllabus));
router.put('/:id', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(updateSyllabus));
router.delete('/:id', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(deleteSyllabus));

// Topic management
router.post('/:id/topics', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(addTopic));
router.patch('/:id/topics/:topicId', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(updateTopic));
router.patch('/:id/topics/:topicId/subtopics/:subtopicId', requirePermission(PERMISSIONS.MANAGE_SYLLABUS), asyncHandler(updateSubtopic));

export default router;
