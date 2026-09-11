import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { requireRole } from '../../security/role.middleware';
import {
  listCourses,
  createCourse,
  listPrograms,
  createProgram,
  listCourseOutcomes,
  createCourseOutcome,
  updateCourseOutcome,
  deleteCourseOutcome,
  listProgramOutcomes,
  createProgramOutcome,
  updateProgramOutcome,
  deleteProgramOutcome,
  upsertCoPoMapping,
  bulkUpsertCoPoMappings,
  getCurriculumGraph,
  validateMappingIntegrity,
  getMappingHistory,
  listBlueprints,
  listPendingBlueprints,
  createBlueprint,
  getBlueprint,
  addBlueprintItem,
  updateBlueprintItem,
  removeBlueprintItem,
  validateBlueprint,
  approveBlueprint,
  rejectBlueprint,
  submitBlueprintForReview,
  getCoAttainment,
  getPoAttainment,
  getAttainmentDashboard,
  getFlaggedCos,
  getMappingChangeHistory,
  getRecentMappingChanges,
  getMappingChangeStats,
  getCoPoMatrixController,
  updateCoPoMatrixController,
  classifyBloomController,
  generateBlueprintQuestionsController,
} from './controller';
import {
  idParamSchema,
  courseIdParamSchema,
  programIdParamSchema,
  createCourseSchema,
  createProgramSchema,
  createCourseOutcomeSchema,
  updateCourseOutcomeSchema,
  createProgramOutcomeSchema,
  updateProgramOutcomeSchema,
  upsertCoPoMappingSchema,
  bulkUpsertCoPoMappingSchema,
  createBlueprintSchema,
  addBlueprintItemSchema,
  updateBlueprintItemSchema,
  approveBlueprintSchema,
  rejectBlueprintSchema,
  attainmentQuerySchema,
  coPoMatrixParamSchema,
  updateCoPoMatrixSchema,
  classifyBloomSchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.get('/courses', requireRole('ADMIN', 'TEACHER'), asyncHandler(listCourses));
router.post('/courses', requireRole('ADMIN', 'TEACHER'), validate(createCourseSchema), asyncHandler(createCourse));
router.get('/courses/:courseId', requireRole('ADMIN', 'TEACHER'), validate(courseIdParamSchema), asyncHandler(getCurriculumGraph));
router.post('/courses/:courseId/validate', requireRole('ADMIN', 'TEACHER'), validate(courseIdParamSchema), asyncHandler(validateMappingIntegrity));

// ── CO/PO Matrix & Bloom Classifier Endpoints (VID-13) ──────────────────────
router.get('/courses/:id/co-po-matrix', requireRole('ADMIN', 'TEACHER'), validate(coPoMatrixParamSchema), asyncHandler(getCoPoMatrixController));
router.post('/courses/:id/co-po-matrix', requireRole('ADMIN', 'TEACHER'), validate(updateCoPoMatrixSchema), asyncHandler(updateCoPoMatrixController));
router.post('/classify-bloom', requireRole('ADMIN', 'TEACHER'), validate(classifyBloomSchema), asyncHandler(classifyBloomController));

router.get('/courses/:courseId/outcomes', requireRole('ADMIN', 'TEACHER'), validate(courseIdParamSchema), asyncHandler(listCourseOutcomes));
router.post('/courses/:courseId/outcomes', requireRole('ADMIN', 'TEACHER'), validate(createCourseOutcomeSchema), asyncHandler(createCourseOutcome));

router.put('/outcomes/:id', requireRole('ADMIN', 'TEACHER'), validate(updateCourseOutcomeSchema), asyncHandler(updateCourseOutcome));
router.delete('/outcomes/:id', requireRole('ADMIN'), validate(idParamSchema), asyncHandler(deleteCourseOutcome));

router.get('/programs', requireRole('ADMIN', 'TEACHER'), asyncHandler(listPrograms));
router.post('/programs', requireRole('ADMIN'), validate(createProgramSchema), asyncHandler(createProgram));

router.get('/programs/:programId/outcomes', requireRole('ADMIN', 'TEACHER'), validate(programIdParamSchema), asyncHandler(listProgramOutcomes));
router.post('/programs/:programId/outcomes', requireRole('ADMIN'), validate(createProgramOutcomeSchema), asyncHandler(createProgramOutcome));

router.put('/program-outcomes/:id', requireRole('ADMIN', 'TEACHER'), validate(updateProgramOutcomeSchema), asyncHandler(updateProgramOutcome));
router.delete('/program-outcomes/:id', requireRole('ADMIN'), validate(idParamSchema), asyncHandler(deleteProgramOutcome));

router.post('/mappings', requireRole('ADMIN', 'TEACHER'), validate(upsertCoPoMappingSchema), asyncHandler(upsertCoPoMapping));
router.post('/mappings/bulk', requireRole('ADMIN', 'TEACHER'), validate(bulkUpsertCoPoMappingSchema), asyncHandler(bulkUpsertCoPoMappings));
router.get('/mappings/:coId/:poId/history', requireRole('ADMIN', 'TEACHER'), asyncHandler(getMappingHistory));
router.get('/mappings/changes', requireRole('ADMIN', 'TEACHER'), asyncHandler(getRecentMappingChanges));
router.get('/mappings/changes/stats', requireRole('ADMIN', 'TEACHER'), asyncHandler(getMappingChangeStats));
router.get('/mappings/changes/:mappingId', requireRole('ADMIN', 'TEACHER'), asyncHandler(getMappingChangeHistory));

router.post('/blueprints/generate', requireRole('ADMIN', 'TEACHER'), asyncHandler(generateBlueprintQuestionsController));
router.get('/blueprints/pending', requireRole('ADMIN'), asyncHandler(listPendingBlueprints));
router.get('/courses/:courseId/blueprints', requireRole('ADMIN', 'TEACHER'), validate(courseIdParamSchema), asyncHandler(listBlueprints));
router.post('/courses/:courseId/blueprints', requireRole('ADMIN', 'TEACHER'), validate(createBlueprintSchema), asyncHandler(createBlueprint));
router.get('/blueprints/:id', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(getBlueprint));
router.post('/blueprints/:id/items', requireRole('ADMIN', 'TEACHER'), validate(addBlueprintItemSchema), asyncHandler(addBlueprintItem));
router.put('/blueprints/:blueprintId/items/:itemId', requireRole('ADMIN', 'TEACHER'), validate(updateBlueprintItemSchema), asyncHandler(updateBlueprintItem));
router.delete('/blueprints/:blueprintId/items/:itemId', requireRole('ADMIN', 'TEACHER'), asyncHandler(removeBlueprintItem));
router.post('/blueprints/:id/validate', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(validateBlueprint));
router.post('/blueprints/:id/submit', requireRole('ADMIN', 'TEACHER'), validate(idParamSchema), asyncHandler(submitBlueprintForReview));
router.post('/blueprints/:id/approve', requireRole('ADMIN'), validate(approveBlueprintSchema), asyncHandler(approveBlueprint));
router.post('/blueprints/:id/reject', requireRole('ADMIN'), validate(rejectBlueprintSchema), asyncHandler(rejectBlueprint));

router.get('/courses/:courseId/attainment', requireRole('ADMIN', 'TEACHER'), validate(courseIdParamSchema), validate(attainmentQuerySchema), asyncHandler(getAttainmentDashboard));
router.get('/courses/:courseId/attainment/co', requireRole('ADMIN', 'TEACHER'), validate(courseIdParamSchema), validate(attainmentQuerySchema), asyncHandler(getCoAttainment));
router.get('/courses/:courseId/attainment/flagged', requireRole('ADMIN', 'TEACHER'), validate(courseIdParamSchema), validate(attainmentQuerySchema), asyncHandler(getFlaggedCos));
router.get('/attainment/po', requireRole('ADMIN', 'TEACHER'), validate(attainmentQuerySchema), asyncHandler(getPoAttainment));

export default router;
