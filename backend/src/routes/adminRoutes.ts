import express from 'express';
import { protect, requireAdmin } from '../middlewares/authMiddleware';

import { obtenerCoacheesActivos, obtenerMetricasConsolidadas } from '../controllers/adminController';
import { obtenerMetricasEjecutivas } from '../controllers/executiveController';

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.get('/metrics/health', (req, res) => {
  res.json({ status: 'ok', message: 'pong', version: 'V1.0' });
});

router.get('/users/list', obtenerCoacheesActivos);
router.get('/metrics/consolidated', obtenerMetricasConsolidadas);
router.get('/metrics/executive', obtenerMetricasEjecutivas);

export default router;
