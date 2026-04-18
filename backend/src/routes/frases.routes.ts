import { Router, Request, Response, NextFunction } from 'express';
import { obtenerFrases, crearFrase, eliminarFrase } from '../controllers/frases.controller';
import { protect, AuthRequest } from '../middlewares/authMiddleware';

const router = Router();

const ensureAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'No autorizado, requiere acceso de Administrador' });
  }
};

router.get('/', protect, ensureAdmin, obtenerFrases);
router.post('/', protect, ensureAdmin, crearFrase);
router.delete('/:id', protect, ensureAdmin, eliminarFrase);

export default router;
