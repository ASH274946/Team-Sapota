import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  search,
  retrieve,
  listIndexedDocuments,
  reindexDocument,
  ragQuery,
  getStats,
} from './controller';
import {
  searchSchema,
  retrieveSchema,
  listIndexedDocumentsSchema,
  reindexDocumentSchema,
  ragQuerySchema,
} from './validators';

const router = Router();

router.use(authenticate);

router.post('/search', validate(searchSchema), asyncHandler(search));
router.post('/retrieve', validate(retrieveSchema), asyncHandler(retrieve));
router.get('/documents', validate(listIndexedDocumentsSchema), asyncHandler(listIndexedDocuments));
router.post('/documents/:id/reindex', validate(reindexDocumentSchema), asyncHandler(reindexDocument));
router.post('/query', validate(ragQuerySchema), asyncHandler(ragQuery));
router.get('/stats', asyncHandler(getStats));

export default router;
