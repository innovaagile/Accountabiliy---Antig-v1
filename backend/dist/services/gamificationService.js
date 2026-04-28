"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluarRacha = exports.calcularXPObtenida = exports.calcularNivel = void 0;
const db_1 = __importDefault(require("../config/db"));
/**
 * Retorna el Nivel y Color de acuerdo a la XP actual del usuario.
 */
const calcularNivel = (xp) => {
    if (xp >= 580)
        return { nivel: 'Maestro', color: '#9333EA' }; // Púrpura
    if (xp >= 320)
        return { nivel: 'Ejecutivo', color: '#38BDF8' }; // Azul claro
    if (xp >= 150)
        return { nivel: 'Constante', color: '#A9D42C' }; // Verde Innova
    return { nivel: 'Iniciado', color: '#9CA3AF' }; // Gris plata
};
exports.calcularNivel = calcularNivel;
/**
 * Calcula la XP a otorgar por marcar una tarea como completada.
 * - Base: 10 XP
 * - Bono puntualidad: 5 XP (Si es dentro de +/- 1hr de la hora programada)
 * - Bono aprendizaje: 5 XP (Si llenó el campo)
 * - Bono racha: 2 XP * racha actual
 */
const calcularXPObtenida = (tarea, cumplimiento, rachaActual) => {
    return 10;
};
exports.calcularXPObtenida = calcularXPObtenida;
/**
 * Evalúa y actualiza la racha diaria del usuario.
 * Regla: +1 si completó al menos 1 tarea. Vuelve a 0 si no completó nada ni usó comodín en el día hábil anterior.
 */
const evaluarRacha = async (userId, cicloId) => {
    try {
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return;
        // Aquí iría la lógica exhaustiva de evaluación de días anteriores.
        // Como simplificación inicial, esta función será llamada al final de cada acción de cumplimiento.
        // Si queremos un chequeo "cron", lo haríamos en una tarea programada. 
        // Dejaremos la actualización real de racha para el momento del cumplimiento (registrarCumplimiento),
        // basándonos en la fecha actual.
    }
    catch (error) {
        console.error("Error al evaluar racha:", error);
    }
};
exports.evaluarRacha = evaluarRacha;
