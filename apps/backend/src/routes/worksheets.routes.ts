import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middlewares/auth.middleware';
import { 
  generateWorksheet, 
  getSheets, 
  getSheet,
  removeSheet
} from '../controllers/worksheets.controller';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(generateWorksheet));
router.get('/', asyncHandler(getSheets));
router.get('/:id', asyncHandler(getSheet));
router.delete('/:id', asyncHandler(removeSheet));

export default router;
