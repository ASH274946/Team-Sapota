import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  listSubjects,
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject,
  getSubjectSyllabus,
  getSubjectTeachers,
} from './controller';
import {
  listSubjectsSchema,
  createSubjectSchema,
  updateSubjectSchema,
  subjectIdParamSchema,
  getSubjectSyllabusSchema,
  getSubjectTeachersSchema,
  deleteSubjectSchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.get('/', validate(listSubjectsSchema), asyncHandler(listSubjects));
router.post('/', authorize(['ADMIN', 'TEACHER']), validate(createSubjectSchema), asyncHandler(createSubject));
router.get('/:id', validate(subjectIdParamSchema), asyncHandler(getSubject));
router.put('/:id', authorize(['ADMIN', 'TEACHER']), validate(updateSubjectSchema), asyncHandler(updateSubject));
router.delete('/:id', authorize(['ADMIN']), validate(deleteSubjectSchema), asyncHandler(deleteSubject));
router.get('/:id/syllabus', validate(getSubjectSyllabusSchema), asyncHandler(getSubjectSyllabus));
router.get('/:id/teachers', validate(getSubjectTeachersSchema), asyncHandler(getSubjectTeachers));

export default router;
