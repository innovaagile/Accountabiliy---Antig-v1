import { Router } from 'express';
import { login, cambiarPassword } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/cambiar-password', protect, cambiarPassword);

export default router;