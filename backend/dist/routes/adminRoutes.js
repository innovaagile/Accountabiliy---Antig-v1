"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const adminController_1 = require("../controllers/adminController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.use(authMiddleware_1.requireAdmin);
router.get('/metrics/health', (req, res) => {
    res.json({ status: 'ok', message: 'pong', version: 'V1.0' });
});
router.get('/users/list', adminController_1.obtenerCoacheesActivos);
router.get('/metrics/consolidated', adminController_1.obtenerMetricasConsolidadas);
exports.default = router;
