"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coacheeController_1 = require("../controllers/coacheeController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const tareaController_1 = require("../controllers/tareaController");
const router = (0, express_1.Router)();
const ensureAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403).json({ message: 'No autorizado, requiere acceso de Administrador' });
    }
};
const ensureAdminOrSelf = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        return next();
    }
    if (req.user && req.user.role === 'COACHEE' && req.user.id === req.params.id) {
        return next();
    }
    res.status(403).json({ error: 'Prohibido' });
};
router.get('/', authMiddleware_1.protect, ensureAdmin, coacheeController_1.obtenerCoachees);
router.get('/:id', authMiddleware_1.protect, ensureAdminOrSelf, coacheeController_1.obtenerCoacheePorId);
router.get('/:id/avances', authMiddleware_1.protect, ensureAdminOrSelf, coacheeController_1.obtenerMisAvances);
router.post('/', authMiddleware_1.protect, ensureAdmin, coacheeController_1.createCoachee);
router.put('/:id', authMiddleware_1.protect, ensureAdminOrSelf, coacheeController_1.actualizarCoachee);
router.patch('/:id/toggle-estado', authMiddleware_1.protect, ensureAdmin, coacheeController_1.toggleEstadoCoachee);
router.delete('/:id', authMiddleware_1.protect, ensureAdmin, coacheeController_1.eliminarCoachee);
router.post('/:id/reset-password', authMiddleware_1.protect, ensureAdmin, coacheeController_1.resetearPassword);
router.post('/:id/enviar-contrato', authMiddleware_1.protect, ensureAdmin, coacheeController_1.enviarContrato);
router.post('/:id/ciclos/continuar', authMiddleware_1.protect, ensureAdmin, coacheeController_1.continuarCiclo);
router.post('/:id/ciclos', authMiddleware_1.protect, ensureAdmin, coacheeController_1.crearCicloInteligente);
router.delete('/:id/ciclos/:cicloId', authMiddleware_1.protect, ensureAdmin, coacheeController_1.eliminarCiclo);
router.put('/:id/ciclos/:cicloId', authMiddleware_1.protect, ensureAdminOrSelf, coacheeController_1.actualizarCiclo);
router.post('/:id/ciclos/:cicloId/tareas', authMiddleware_1.protect, ensureAdminOrSelf, tareaController_1.crearTarea);
router.put('/:id/ciclos/:cicloId/tareas/:tareaId', authMiddleware_1.protect, ensureAdminOrSelf, tareaController_1.actualizarTarea);
router.patch('/:id/ciclos/:cicloId/tareas/:tareaId', authMiddleware_1.protect, ensureAdminOrSelf, tareaController_1.registrarCumplimiento);
router.delete('/:id/ciclos/:cicloId/tareas/:tareaId', authMiddleware_1.protect, ensureAdminOrSelf, tareaController_1.eliminarTarea);
router.post('/:id/ciclos/:cicloId/comodines/usar', authMiddleware_1.protect, ensureAdminOrSelf, coacheeController_1.usarComodin);
exports.default = router;
