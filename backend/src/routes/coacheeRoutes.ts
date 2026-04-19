import { Router, Request, Response, NextFunction } from 'express';
import { obtenerCoachees, obtenerCoacheePorId, createCoachee, actualizarCoachee, eliminarCoachee, resetearPassword, enviarContrato } from '../controllers/coacheeController';
import { protect, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

const ensureAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'No autorizado, requiere acceso de Administrador' });
  }
};

router.get('/', protect, ensureAdmin, obtenerCoachees);
router.get('/:id', protect, ensureAdmin, obtenerCoacheePorId);
router.post('/', protect, ensureAdmin, createCoachee);
router.put('/:id', protect, ensureAdmin, actualizarCoachee);
router.delete('/:id', protect, ensureAdmin, eliminarCoachee);
router.post('/:id/reset-password', protect, ensureAdmin, resetearPassword);
router.post('/:id/enviar-contrato', protect, ensureAdmin, enviarContrato);

export default router;