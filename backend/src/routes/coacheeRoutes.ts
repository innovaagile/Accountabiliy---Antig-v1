import { Router, Request, Response, NextFunction } from 'express';
import { obtenerCoachees, obtenerCoacheePorId, createCoachee, actualizarCoachee, eliminarCoachee, eliminarCoacheesMasivo, resetearPassword, enviarContrato, crearCicloInteligente, eliminarCiclo, actualizarCiclo, continuarCiclo, toggleEstadoCoachee, obtenerMisAvances, usarComodin } from '../controllers/coacheeController';
import { protect, AuthRequest } from '../middlewares/authMiddleware';
import { crearTarea, actualizarTarea, eliminarTarea, registrarCumplimiento } from '../controllers/tareaController';
import multer from 'multer';
import { descargarPlantillaImportacion, importarMasivo, exportarTransaccional } from '../controllers/importExportController';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

const ensureAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'No autorizado, requiere acceso de Administrador' });
  }
};

const ensureAdminOrSelf = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  if (req.user && req.user.role === 'COACHEE' && req.user.id === req.params.id) {
    return next();
  }
  res.status(403).json({ error: 'Prohibido' });
};

router.get('/export/template', protect, ensureAdmin, descargarPlantillaImportacion);
router.post('/import/masivo', protect, ensureAdmin, upload.single('file'), importarMasivo);
router.get('/export/transaccional', protect, ensureAdmin, exportarTransaccional);

router.get('/', protect, ensureAdmin, obtenerCoachees);
router.get('/:id', protect, ensureAdminOrSelf, obtenerCoacheePorId);
router.get('/:id/avances', protect, ensureAdminOrSelf, obtenerMisAvances);
router.post('/', protect, ensureAdmin, createCoachee);
router.post('/bulk-delete', protect, ensureAdmin, eliminarCoacheesMasivo);
router.put('/:id', protect, ensureAdminOrSelf, actualizarCoachee);
router.patch('/:id/toggle-estado', protect, ensureAdmin, toggleEstadoCoachee);
router.delete('/:id', protect, ensureAdmin, eliminarCoachee);
router.post('/:id/reset-password', protect, ensureAdmin, resetearPassword);
router.post('/:id/enviar-contrato', protect, ensureAdmin, enviarContrato);
router.post('/:id/ciclos/continuar', protect, ensureAdmin, continuarCiclo);
router.post('/:id/ciclos', protect, ensureAdmin, crearCicloInteligente);
router.delete('/:id/ciclos/:cicloId', protect, ensureAdmin, eliminarCiclo);
router.put('/:id/ciclos/:cicloId', protect, ensureAdminOrSelf, actualizarCiclo);
router.post('/:id/ciclos/:cicloId/tareas', protect, ensureAdminOrSelf, crearTarea);
router.put('/:id/ciclos/:cicloId/tareas/:tareaId', protect, ensureAdminOrSelf, actualizarTarea);
router.patch('/:id/ciclos/:cicloId/tareas/:tareaId', protect, ensureAdminOrSelf, registrarCumplimiento);
router.delete('/:id/ciclos/:cicloId/tareas/:tareaId', protect, ensureAdminOrSelf, eliminarTarea);
router.post('/:id/ciclos/:cicloId/comodines/usar', protect, ensureAdminOrSelf, usarComodin);

export default router;