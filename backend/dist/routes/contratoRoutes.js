"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contratoController_1 = require("../controllers/contratoController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/sellar', authMiddleware_1.protect, contratoController_1.sellarContrato);
exports.default = router;
