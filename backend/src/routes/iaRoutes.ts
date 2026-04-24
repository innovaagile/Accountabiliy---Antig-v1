import { Router } from 'express';
import { generarPlan, enviarEmail } from '../controllers/iaController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/generar-plan', protect, generarPlan);
router.post('/enviar-email', protect, enviarEmail);

export default router;
