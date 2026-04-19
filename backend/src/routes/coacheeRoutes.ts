import { Router, Request, Response, NextFunction } from 'express';
import { obtenerCoachees, obtenerCoacheePorId, createCoachee, actualizarCoachee, eliminarCoachee, resetearPassword, enviarContrato, crearCicloInteligente, eliminarCiclo, actualizarCiclo, continuarCiclo, toggleEstadoCoachee } from '../controllers/coacheeController';
import { protect, AuthRequest } from '../middlewares/authMiddleware';
import { crearTarea, actualizarTarea, eliminarTarea } from '../controllers/tareaController';

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
router.patch('/:id/toggle-estado', protect, ensureAdmin, toggleEstadoCoachee);
router.delete('/:id', protect, ensureAdmin, eliminarCoachee);
router.post('/:id/reset-password', protect, ensureAdmin, resetearPassword);
router.post('/:id/enviar-contrato', protect, ensureAdmin, enviarContrato);
router.post('/:id/ciclos/continuar', protect, ensureAdmin, continuarCiclo);
router.post('/:id/ciclos', protect, ensureAdmin, crearCicloInteligente);
router.delete('/:id/ciclos/:cicloId', protect, ensureAdmin, eliminarCiclo);
router.put('/:id/ciclos/:cicloId', protect, ensureAdmin, actualizarCiclo);
router.post('/:id/ciclos/:cicloId/tareas', protect, ensureAdmin, crearTarea);
router.put('/:id/ciclos/:cicloId/tareas/:tareaId', protect, ensureAdmin, actualizarTarea);
router.delete('/:id/ciclos/:cicloId/tareas/:tareaId', protect, ensureAdmin, eliminarTarea);

export default router;