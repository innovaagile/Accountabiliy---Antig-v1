"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const iaController_1 = require("../controllers/iaController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/generar-plan', authMiddleware_1.protect, iaController_1.generarPlan);
router.post('/enviar-email', authMiddleware_1.protect, iaController_1.enviarEmail);
exports.default = router;
