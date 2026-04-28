"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizarDiagnostico = void 0;
const db_1 = __importDefault(require("../config/db"));
const finalizarDiagnostico = async (req, res) => {
    try {
        const { podioFinal, dimensionGanadora } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'No autorizado' });
            return;
        }
        const user = await db_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        // Actualizar o crear diagnóstico
        await db_1.default.diagnostico.upsert({
            where: { userId },
            update: {
                estado: 'COMPLETADO',
                podioFinal,
                dimensionGanadora,
            },
            create: {
                userId,
                estado: 'COMPLETADO',
                podioFinal,
                dimensionGanadora,
                respuestasRaw: {}, // Se puede complementar luego si se envía desde el frontend
            },
        });
        // Actualizar flag del usuario
        await db_1.default.user.update({
            where: { id: userId },
            data: { hasDiagnostico: true },
        });
        // Bifurcación basada en servicio
        if (user.servicioContratado === 'EXECUTIVE_MASTERY') {
            res.json({
                success: true,
                action: 'REDIRECT_TIDYCAL',
                url: 'https://tidycal.com/tu_link_ejemplo' // Reemplazar con el link real a Tidycal
            });
            return;
        }
        // Por defecto SPRINT_4S
        // TODO: Integrar Gemini prompt en el backend para crear el Ciclo 1 en el futuro
        res.json({
            success: true,
            action: 'CREATE_CYCLE'
        });
    }
    catch (error) {
        console.error('Error al finalizar diagnóstico:', error);
        res.status(500).json({ message: 'Error interno del servidor', error });
    }
};
exports.finalizarDiagnostico = finalizarDiagnostico;
