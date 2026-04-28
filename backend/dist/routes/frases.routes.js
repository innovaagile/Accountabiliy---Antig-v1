"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const frases_controller_1 = require("../controllers/frases.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const ensureAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    }
    else {
        res.status(403).json({ message: 'No autorizado, requiere acceso de Administrador' });
    }
};
router.get('/', authMiddleware_1.protect, ensureAdmin, frases_controller_1.obtenerFrases);
router.post('/', authMiddleware_1.protect, ensureAdmin, frases_controller_1.crearFrase);
router.delete('/:id', authMiddleware_1.protect, ensureAdmin, frases_controller_1.eliminarFrase);
exports.default = router;
