import { Router } from 'express';
import { sellarContrato } from '../controllers/contratoController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/sellar', protect, sellarContrato);

export default router;
