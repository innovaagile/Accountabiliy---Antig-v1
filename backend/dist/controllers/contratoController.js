"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellarContrato = void 0;
const db_1 = __importDefault(require("../config/db"));
const pdfService_1 = require("../services/pdfService");
const emailService_1 = require("../services/emailService");
const sellarContrato = async (req, res) => {
    try {
        // protect middleware inyecta req.user
        const userId = req.user?.id;
        const { firma, planGenerado } = req.body;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Usuario no autenticado' });
            return;
        }
        if (!firma || !planGenerado) {
            res.status(400).json({ success: false, message: 'Faltan datos requeridos (firma, planGenerado)' });
            return;
        }
        const user = await db_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            return;
        }
        // 1. Generar el PDF
        const pdfBuffer = await (0, pdfService_1.generateContractPDF)(firma, planGenerado);
        // 2. Enviar el correo con el adjunto
        await (0, emailService_1.enviarContratoPdf)(user.email, user.nombre, pdfBuffer);
        // 3. Actualizar base de datos del usuario
        await db_1.default.user.update({
            where: { id: userId },
            data: {
                hasDiagnostico: true,
                contratoFirmado: true
            }
        });
        // 4. Guardar tareas en el ciclo activo
        const cicloActivo = await db_1.default.ciclo.findFirst({
            where: { userId, activo: true },
            orderBy: { fechaInicio: 'desc' }
        });
        if (cicloActivo && planGenerado) {
            const tareasPromises = [];
            if (Array.isArray(planGenerado.micro_habitos_diarios)) {
                for (const habito of planGenerado.micro_habitos_diarios) {
                    tareasPromises.push(db_1.default.tarea.create({
                        data: {
                            cicloId: cicloActivo.id,
                            nombre: habito.titulo,
                            descripcion: habito.medicion,
                            momento: habito.disparador,
                            accion: habito.accion,
                            periodicidad: 'DIARIA',
                            activa: true
                        }
                    }));
                }
            }
            if (planGenerado.micro_habito_semanal) {
                const habito = planGenerado.micro_habito_semanal;
                tareasPromises.push(db_1.default.tarea.create({
                    data: {
                        cicloId: cicloActivo.id,
                        nombre: habito.titulo,
                        descripcion: habito.medicion,
                        momento: habito.disparador,
                        accion: habito.accion,
                        periodicidad: 'SEMANAL',
                        activa: true
                    }
                }));
            }
            await Promise.all(tareasPromises);
        }
        res.status(200).json({ success: true, message: 'Contrato sellado y enviado exitosamente.', pdfBase64: pdfBuffer.toString('base64') });
    }
    catch (error) {
        console.error('Error al sellar contrato:', error);
        res.status(500).json({ success: false, message: 'Error interno al sellar contrato', error: error.message });
    }
};
exports.sellarContrato = sellarContrato;
