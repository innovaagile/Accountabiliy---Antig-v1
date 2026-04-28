"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerMetricasConsolidadas = exports.obtenerCoacheesActivos = void 0;
const db_1 = __importDefault(require("../config/db"));
const obtenerCoacheesActivos = async (req, res) => {
    try {
        const coachees = await db_1.default.user.findMany({
            where: {
                role: 'COACHEE',
                activo: true,
            },
            select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
                company: {
                    select: {
                        nombre: true,
                    },
                },
            },
            orderBy: {
                nombre: 'asc',
            },
        });
        // Transformar para que se alinee con `{ id, nombre, email, company: { nombre } }` y combino nombre+apellido si lo desean, pero `nombre` y `apellido` está bien.
        const result = coachees.map(c => ({
            id: c.id,
            nombre: `${c.nombre} ${c.apellido}`.trim(),
            email: c.email,
            company: c.company ? { nombre: c.company.nombre } : { nombre: 'Sin Empresa' }
        }));
        res.json(result);
    }
    catch (error) {
        console.error('Error al obtener coachees activos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios' });
    }
};
exports.obtenerCoacheesActivos = obtenerCoacheesActivos;
const dashboardBffService_1 = require("../services/dashboardBffService");
const gamificationService_1 = require("../services/gamificationService");
const obtenerMetricasConsolidadas = async (req, res) => {
    try {
        const coachees = await db_1.default.user.findMany({
            where: {
                role: 'COACHEE',
                activo: true,
            },
            include: {
                company: true,
                ciclos: {
                    where: { estado: 'ACTIVO', activo: true },
                    orderBy: { fechaInicio: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                nombre: 'asc',
            },
        });
        const metricsPromises = coachees.map(async (c) => {
            let consistencia = 0;
            const cicloActivo = c.ciclos[0];
            if (cicloActivo) {
                const heatmapInfo = await (0, dashboardBffService_1.generarHeatmap)(cicloActivo.id, cicloActivo.fechaInicio, cicloActivo.fechaFin);
                consistencia = heatmapInfo.porcentajeCompromiso;
            }
            const nivel = (0, gamificationService_1.calcularNivel)(c.xpTotal || 0);
            const estadoHealth = consistencia >= 70 ? 'On Track' : 'At Risk';
            return {
                id: c.id,
                nombre: `${c.nombre} ${c.apellido}`.trim(),
                email: c.email,
                empresa: c.company?.nombre || 'Sin Empresa',
                cargo: c.cargo || 'Sin Cargo',
                consistencia,
                rango: nivel.nivel,
                estadoHealth
            };
        });
        const result = await Promise.all(metricsPromises);
        res.json(result);
    }
    catch (error) {
        console.error('Error al obtener métricas consolidadas:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener métricas' });
    }
};
exports.obtenerMetricasConsolidadas = obtenerMetricasConsolidadas;
