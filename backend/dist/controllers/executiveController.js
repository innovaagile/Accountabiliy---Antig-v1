"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerMetricasEjecutivas = void 0;
const db_1 = __importDefault(require("../config/db"));
const dashboardBffService_1 = require("../services/dashboardBffService");
const obtenerMetricasEjecutivas = async (req, res) => {
    try {
        const { empresas, cargos, search, fechaInicio, fechaFin } = req.query;
        let whereClause = { role: 'COACHEE', activo: true };
        if (search) {
            whereClause.OR = [
                { nombre: { contains: String(search), mode: 'insensitive' } },
                { apellido: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        if (empresas) {
            const empresasArr = String(empresas).split(',');
            whereClause.company = { nombre: { in: empresasArr } };
        }
        if (cargos) {
            const cargosArr = String(cargos).split(',');
            whereClause.cargo = { in: cargosArr };
        }
        const coachees = await db_1.default.user.findMany({
            where: whereClause,
            include: {
                ciclos: {
                    where: { estado: 'ACTIVO', activo: true },
                    orderBy: { fechaInicio: 'desc' },
                    take: 1
                }
            }
        });
        let sumaRacha = 0;
        let sumaConsistencia = 0;
        let countRacha = 0;
        let countConsistencia = 0;
        let histograma = {
            '0-2': 0,
            '3-5': 0,
            '6-9': 0,
            '10+': 0
        };
        let diarias = 0;
        let noDiarias = 0; // Semanales o puntuales
        const metricsPromises = coachees.map(async (c) => {
            let consistencia = 0;
            const cicloActivo = c.ciclos[0];
            if (cicloActivo) {
                // Fetch tasks to check operational mix
                const tareas = await db_1.default.tarea.findMany({
                    where: { cicloId: cicloActivo.id, activa: true }
                });
                tareas.forEach(t => {
                    if (t.periodicidad === 'DIARIA')
                        diarias++;
                    else
                        noDiarias++;
                });
                const heatmapInfo = await (0, dashboardBffService_1.generarHeatmap)(cicloActivo.id, cicloActivo.fechaInicio, cicloActivo.fechaFin);
                consistencia = heatmapInfo.porcentajeCompromiso;
                sumaConsistencia += consistencia;
                countConsistencia++;
                // Calcular racha real dinámicamente como en el BFF
                racha = (0, dashboardBffService_1.calcularRachaReal)(heatmapInfo.heatmapDays);
            }
            sumaRacha += racha;
            countRacha++;
            if (racha <= 2)
                histograma['0-2']++;
            else if (racha <= 5)
                histograma['3-5']++;
            else if (racha <= 9)
                histograma['6-9']++;
            else
                histograma['10+']++;
        });
        await Promise.all(metricsPromises);
        const rachaPromedio = countRacha > 0 ? Math.round(sumaRacha / countRacha) : 0;
        const compromisoPromedio = countConsistencia > 0 ? Math.round(sumaConsistencia / countConsistencia) : 0;
        const totalTareas = diarias + noDiarias;
        const mixOperativo = totalTareas > 0
            ? { diarias: Math.round((diarias / totalTareas) * 100), noDiarias: Math.round((noDiarias / totalTareas) * 100) }
            : { diarias: 0, noDiarias: 0 };
        res.json({
            rachaPromedio,
            compromisoPromedio,
            histogramaRacha: [
                { name: '0-2 días', value: histograma['0-2'] },
                { name: '3-5 días', value: histograma['3-5'] },
                { name: '6-9 días', value: histograma['6-9'] },
                { name: '10+ días', value: histograma['10+'] }
            ],
            mixOperativo: [
                { name: 'Diarias', value: mixOperativo.diarias },
                { name: 'Semanales', value: mixOperativo.noDiarias }
            ]
        });
    }
    catch (error) {
        console.error('Error al obtener métricas ejecutivas:', error);
        res.status(500).json({ message: 'Error interno al obtener métricas ejecutivas' });
    }
};
exports.obtenerMetricasEjecutivas = obtenerMetricasEjecutivas;
