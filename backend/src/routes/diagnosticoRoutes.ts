import { Router } from 'express';
import { finalizarDiagnostico } from '../controllers/diagnosticoController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint para finalizar diagnóstico, protegido por token JWT
router.post('/finalizar', protect, finalizarDiagnostico);

export default router;
