import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  listSyllabusEntries,
  createSyllabusEntry,
  getSyllabusEntry,
  updateSyllabus,
  deleteSyllabusEntry,
  addTopic,
  updateTopic,
  removeTopic,
  updateSubtopics,
} from './controller';
import {
  listSyllabusSchema,
  createSyllabusSchema,
  updateSyllabusSchema,
  syllabusIdParamSchema,
  addTopicSchema,
  updateTopicSchema,
  topicIdParamSchema,
  updateSubtopicsSchema,
  deleteSyllabusSchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.get('/', validate(listSyllabusSchema), asyncHandler(listSyllabusEntries));
router.post('/', authorize(['ADMIN', 'TEACHER']), validate(createSyllabusSchema), asyncHandler(createSyllabusEntry));
router.get('/:id', validate(syllabusIdParamSchema), asyncHandler(getSyllabusEntry));
router.put('/:id', authorize(['ADMIN', 'TEACHER']), validate(updateSyllabusSchema), asyncHandler(updateSyllabus));
router.delete('/:id', authorize(['ADMIN']), validate(deleteSyllabusSchema), asyncHandler(deleteSyllabusEntry));
router.post('/:id/topics', authorize(['ADMIN', 'TEACHER']), validate(addTopicSchema), asyncHandler(addTopic));
router.put('/topics/:topicId', authorize(['ADMIN', 'TEACHER']), validate(updateTopicSchema), asyncHandler(updateTopic));
router.delete('/topics/:topicId', authorize(['ADMIN', 'TEACHER']), validate(topicIdParamSchema), asyncHandler(removeTopic));
router.put('/topics/:topicId/subtopics', authorize(['ADMIN', 'TEACHER']), validate(updateSubtopicsSchema), asyncHandler(updateSubtopics));

export default router;
