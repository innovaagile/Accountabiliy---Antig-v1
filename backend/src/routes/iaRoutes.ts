import { Router } from 'express';
import { generarPlan } from '../controllers/iaController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/generar-plan', protect, generarPlan);

export default router;
