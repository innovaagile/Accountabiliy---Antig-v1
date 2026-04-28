"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diagnosticoController_1 = require("../controllers/diagnosticoController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Endpoint para finalizar diagnóstico, protegido por token JWT
router.post('/finalizar', authMiddleware_1.protect, diagnosticoController_1.finalizarDiagnostico);
exports.default = router;
