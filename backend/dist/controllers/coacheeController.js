"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usarComodin = exports.obtenerMisAvances = exports.toggleEstadoCoachee = exports.continuarCiclo = exports.actualizarCiclo = exports.eliminarCiclo = exports.crearCicloInteligente = exports.enviarContrato = exports.resetearPassword = exports.eliminarCoachee = exports.actualizarCoachee = exports.createCoachee = exports.obtenerCoacheePorId = exports.obtenerCoachees = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const emailService_1 = require("../utils/emailService");
const emailService_2 = require("../services/emailService");
const dateUtils_1 = require("../utils/dateUtils");
const gamificationService_1 = require("../services/gamificationService");
const obtenerCoachees = async (req, res) => {
    try {
        const { search, empresa, cargo, servicio, estado } = req.query;
        let whereClause = { role: 'COACHEE' };
        if (search) {
            whereClause.OR = [
                { nombre: { contains: String(search), mode: 'insensitive' } },
                { apellido: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        if (empresa)
            whereClause.company = { nombre: String(empresa) };
        if (cargo)
            whereClause.cargo = String(cargo);
        // Asumimos lógica de negocio que valida con los ciclos
        if (servicio) {
            whereClause.ciclos = { some: { producto: String(servicio) } };
        }
        if (estado !== undefined) {
            whereClause.activo = estado === 'true' || estado === 'activo';
        }
        const coachees = await db_1.default.user.findMany({
            where: whereClause,
            include: {
                ciclos: true,
                contracts: true,
                company: true
            }
        });
        const formatted = coachees.map((c) => ({
            id: c.id,
            nombre: `${c.nombre} ${c.apellido}`,
            email: c.email,
            pais: c.pais || 'No especificado',
            telefono: c.telefono || 'No especificado',
            empresa: c.company?.nombre || 'Sin Empresa',
            cargo: c.cargo,
            plan: c.servicioContratado || 'No asignado',
            frecuencia: c.frecuenciaRecordatorios || 'No especificada',
            estado: c.activo ? 'Activo' : 'Inactivo',
            activo: c.activo,
        }));
        res.json(formatted);
    }
    catch (error) {
        console.error('Error al obtener coachees:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.obtenerCoachees = obtenerCoachees;
const obtenerCoacheePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const coachee = await db_1.default.user.findFirst({
            where: {
                id,
                role: 'COACHEE'
            },
            include: {
                ciclos: {
                    include: {
                        tareas: {
                            include: {
                                cumplimientos: true
                            }
                        }
                    },
                    orderBy: { id: 'desc' }
                },
                contracts: true
            }
        });
        if (!coachee) {
            res.status(404).json({ message: 'Coachee no encontrado' });
            return;
        }
        if (coachee.ciclos && coachee.ciclos.length > 0) {
            coachee.ciclos = coachee.ciclos.map(ciclo => {
                if (ciclo.activo) {
                    ciclo.diaHabilActual = (0, dateUtils_1.calcularDiaHabilActual)(ciclo.fechaInicio, new Date());
                }
                return ciclo;
            });
        }
        // Inyectar detalle de nivel de gamificación
        const nivelDetalle = (0, gamificationService_1.calcularNivel)(coachee.xpTotal || 0);
        const coacheeResponse = {
            ...coachee,
            nivelDetalle
        };
        res.json(coacheeResponse);
    }
    catch (error) {
        console.error('Error al obtener coachee por id:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.obtenerCoacheePorId = obtenerCoacheePorId;
const createCoachee = async (req, res) => {
    try {
        console.log("--- INICIANDO CREACIÓN DE COACHEE ---");
        const { nombre, apellido, email, pais, telefono, cargo, servicio, frecuencia } = req.body;
        const emailLower = email.toLowerCase();
        const exists = await db_1.default.user.findUnique({ where: { email: emailLower } });
        if (exists) {
            res.status(400).json({ message: 'El coachee ya existe' });
            return;
        }
        // Contraseña estándar temporal para fase DEV
        const tempPassword = "Innova2026";
        const passwordHash = await bcrypt_1.default.hash("Innova2026", 10);
        const newCoachee = await db_1.default.user.create({
            data: {
                nombre, apellido, email: emailLower,
                passwordHash: passwordHash,
                role: 'COACHEE',
                pais, telefono: `+56 ${telefono}`,
                companyId: req.body.companyId || null, cargo,
                servicioContratado: servicio,
                frecuenciaRecordatorios: frecuencia,
            }
        });
        console.log("1. Usuario guardado en BD:", newCoachee.id);
        const planNormalizado = (servicio || '').toLowerCase().trim();
        let totalDias = 28;
        let diasCalendario = 28;
        if (planNormalizado.includes('executive')) {
            totalDias = 40;
            diasCalendario = 56;
        }
        else if (planNormalizado.includes('4s')) {
            totalDias = 28;
            diasCalendario = 28;
        }
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setDate(fechaInicio.getDate() + diasCalendario);
        console.log(`2. Intentando crear ciclo de ${diasCalendario} días...`);
        try {
            await db_1.default.ciclo.create({
                data: {
                    userId: newCoachee.id,
                    fechaInicio,
                    fechaFin,
                    estado: 'ACTIVO',
                    activo: true,
                    nombre: 'Ciclo 1',
                    producto: servicio || 'SPRINT_4S',
                    totalDias: totalDias,
                    diaActual: 1,
                    comodinesUsados: 0
                }
            });
            console.log("3. Ciclo guardado exitosamente en BD");
        }
        catch (err) {
            console.error("!!! ERROR CREANDO CICLO:", err);
        }
        console.log("4. Intentando enviar email a:", email);
        try {
            await (0, emailService_2.enviarCorreoBienvenida)(email, nombre, tempPassword);
        }
        catch (emailError) {
            console.error("!!! ERROR ENVIANDO EMAIL:", emailError);
            // NO se aborta la creación.
        }
        console.log("5. Respondiendo 201 al frontend");
        res.status(201).json({
            id: newCoachee.id,
            nombre: `${newCoachee.nombre} ${newCoachee.apellido}`,
            email: newCoachee.email,
            pais: newCoachee.pais || 'No especificado',
            telefono: newCoachee.telefono || 'No especificado',
            plan: servicio,
            frecuencia: frecuencia,
            estado: 'Activo'
        });
    }
    catch (error) {
        console.error("!!! ERROR FATAL CREANDO COACHEE:", error);
        res.status(500).json({ message: 'Error creando coachee' });
    }
};
exports.createCoachee = createCoachee;
const actualizarCoachee = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, pais, telefono, cargo, activo, servicioContratado, frecuenciaRecordatorios, hasDiagnostico } = req.body;
        const emailLower = email.toLowerCase();
        const coacheeActualizado = await db_1.default.user.update({
            where: { id },
            data: {
                nombre,
                apellido,
                email: emailLower,
                pais,
                telefono,
                companyId: req.body.companyId || undefined,
                cargo,
                activo,
                servicioContratado,
                frecuenciaRecordatorios,
                hasDiagnostico
            }
        });
        if (servicioContratado) {
            const planNormalizado = servicioContratado.toLowerCase().trim();
            let nuevoTotalDias = 28;
            if (planNormalizado.includes('executive')) {
                nuevoTotalDias = 40;
            }
            else if (planNormalizado.includes('4s')) {
                nuevoTotalDias = 28;
            }
            else if (planNormalizado.includes('gold')) {
                nuevoTotalDias = 59;
            }
            await db_1.default.ciclo.updateMany({
                where: { userId: id, estado: 'ACTIVO' },
                data: { totalDias: nuevoTotalDias }
            });
        }
        res.json(coacheeActualizado);
    }
    catch (error) {
        console.error('Error al actualizar coachee:', error);
        res.status(500).json({ message: 'Error interno al actualizar coachee' });
    }
};
exports.actualizarCoachee = actualizarCoachee;
const eliminarCoachee = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.user.delete({ where: { id } });
        res.json({ message: 'Coachee eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar coachee:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.eliminarCoachee = eliminarCoachee;
const resetearPassword = async (req, res) => {
    try {
        const { id } = req.params;
        // Contraseña estándar para reseteo en fase DEV
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash("Innova2026", salt);
        // Actualizar base de datos
        const coachee = await db_1.default.user.update({
            where: { id },
            data: { passwordHash: hashedPassword }
        });
        // Enviar email falso estructurado
        // await enviarCorreoReseteo(coachee.email, coachee.nombre, tempPassword);
        res.json({ message: 'Contraseña reseteada con éxito' });
    }
    catch (error) {
        console.error('Error al resetear password:', error);
        res.status(500).json({ message: 'Error interno del servidor al resetear la clave' });
    }
};
exports.resetearPassword = resetearPassword;
const enviarContrato = async (req, res) => {
    try {
        const { id } = req.params;
        const coachee = await db_1.default.user.findUnique({ where: { id } });
        if (!coachee) {
            res.status(404).json({ message: 'Coachee no encontrado' });
            return;
        }
        await (0, emailService_1.enviarCorreoContrato)(coachee.email, coachee.nombre);
        res.json({ message: 'Contrato enviado exitosamente' });
    }
    catch (error) {
        console.error('Error al enviar contrato:', error);
        res.status(500).json({ message: 'Error interno del servidor al enviar contrato' });
    }
};
exports.enviarContrato = enviarContrato;
const crearCicloInteligente = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        let fechaInicioObj = new Date();
        if (body && body.fechaInicio) {
            fechaInicioObj = new Date(body.fechaInicio);
        }
        const coachee = await db_1.default.user.findUnique({
            where: { id },
            include: { ciclos: true }
        });
        if (!coachee) {
            res.status(404).json({ message: 'Coachee no encontrado' });
            return;
        }
        const { servicioContratado } = coachee;
        if (servicioContratado === 'Audit Toolkit' || servicioContratado === 'Enterprise Execution') {
            res.status(400).json({ message: 'Este servicio no soporta la creación de ciclos' });
            return;
        }
        let diasHabiles = 0;
        if (servicioContratado?.toLowerCase().includes('4s')) {
            diasHabiles = 20;
        }
        else if (servicioContratado?.toLowerCase().includes('executive')) {
            diasHabiles = 40;
        }
        else {
            res.status(400).json({ message: 'Servicio contratado inválido o no soportado' });
            return;
        }
        const fechaFin = body.fechaFin ? new Date(body.fechaFin) : (0, dateUtils_1.calcularFechaFinHabil)(fechaInicioObj, diasHabiles);
        await db_1.default.ciclo.updateMany({
            where: { userId: id },
            data: { estado: 'COMPLETADO', activo: false }
        });
        const countCiclos = await db_1.default.ciclo.count({ where: { userId: id } });
        const nombreCiclo = body.nombre ? body.nombre.replace(' (Continuación)', '') : `Ciclo ${countCiclos + 1}`;
        const nuevoCiclo = await db_1.default.ciclo.create({
            data: {
                userId: id,
                nombre: nombreCiclo,
                fechaInicio: fechaInicioObj,
                fechaFin: fechaFin,
                producto: servicioContratado,
                totalDias: diasHabiles,
                estado: 'ACTIVO',
                activo: true,
                diaActual: 1,
                comodinesUsados: 0
            }
        });
        res.status(201).json(nuevoCiclo);
    }
    catch (error) {
        console.error('Error al crear ciclo inteligente:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.crearCicloInteligente = crearCicloInteligente;
const eliminarCiclo = async (req, res) => {
    try {
        const { cicloId } = req.params;
        await db_1.default.ciclo.delete({ where: { id: cicloId } });
        res.json({ message: 'Ciclo eliminado correctamente' });
    }
    catch (error) {
        console.error('Error al eliminar ciclo:', error);
        res.status(500).json({ message: 'Error interno al eliminar ciclo' });
    }
};
exports.eliminarCiclo = eliminarCiclo;
const actualizarCiclo = async (req, res) => {
    try {
        const { cicloId } = req.params;
        const { nombre, fechaInicio, fechaFin } = req.body;
        console.log("Recibido en Backend (actualizarCiclo):", req.body);
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);
        const updateData = {
            nombre,
            fechaInicio: fechaInicioDate,
            fechaFin: fechaFinDate,
            totalDias: (0, dateUtils_1.calcularDiaHabilActual)(fechaInicioDate, fechaFinDate)
        };
        await db_1.default.ciclo.update({
            where: { id: cicloId },
            data: updateData
        });
        res.json({ message: 'Ciclo actualizado correctamente' });
    }
    catch (error) {
        console.error('Error al actualizar ciclo:', error);
        res.status(500).json({ message: 'Error interno al actualizar ciclo' });
    }
};
exports.actualizarCiclo = actualizarCiclo;
const continuarCiclo = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        let fechaInicioObj = new Date();
        if (body && body.fechaInicio) {
            fechaInicioObj = new Date(body.fechaInicio);
        }
        const coachee = await db_1.default.user.findUnique({
            where: { id },
            include: {
                ciclos: {
                    include: { tareas: true },
                    orderBy: { fechaInicio: 'desc' },
                    take: 1
                }
            }
        });
        if (!coachee || !coachee.servicioContratado) {
            res.status(404).json({ message: 'Coachee o servicio no encontrado' });
            return;
        }
        const { servicioContratado } = coachee;
        // Desactivar ciclos previos poniendolos como COMPLETADO y sin ser el activo principal
        await db_1.default.ciclo.updateMany({
            where: { userId: id },
            data: { estado: 'COMPLETADO', activo: false }
        });
        let diasHabiles = 0;
        if (servicioContratado?.toLowerCase().includes('4s')) {
            diasHabiles = 20;
        }
        else if (servicioContratado?.toLowerCase().includes('executive')) {
            diasHabiles = 40;
        }
        else {
            res.status(400).json({ message: 'El servicio contratado no soporta la creación autocalculada de este ciclo continuo.' });
            return;
        }
        const fechaFin = (0, dateUtils_1.calcularFechaFinHabil)(fechaInicioObj, diasHabiles);
        const countCiclos = await db_1.default.ciclo.count({ where: { userId: id } });
        const nombreCiclo = body.nombre ? body.nombre.replace(' (Continuación)', '') : `Ciclo ${countCiclos + 1}`;
        const nuevoCiclo = await db_1.default.ciclo.create({
            data: {
                userId: id,
                nombre: nombreCiclo,
                fechaInicio: fechaInicioObj,
                fechaFin: fechaFin,
                producto: servicioContratado,
                totalDias: diasHabiles,
                estado: 'ACTIVO',
                activo: true,
                diaActual: 1,
                comodinesUsados: 0
            }
        });
        // Clonacion de tareas del ciclo previo (lienzo en blanco, sin copia de cumplimientos)
        if (coachee.ciclos.length > 0) {
            const tareasPrevias = coachee.ciclos[0].tareas;
            if (tareasPrevias && tareasPrevias.length > 0) {
                const tareasNuevas = tareasPrevias.map((t) => ({
                    cicloId: nuevoCiclo.id,
                    nombre: t.nombre,
                    descripcion: t.descripcion,
                    periodicidad: t.periodicidad,
                    horaProgramada: t.horaProgramada,
                    icono: t.icono,
                    activa: true
                }));
                await db_1.default.tarea.createMany({
                    data: tareasNuevas
                });
            }
        }
        res.status(201).json(nuevoCiclo);
    }
    catch (error) {
        console.error('Error al continuar ciclo:', error);
        res.status(500).json({ message: 'Error interno del servidor al continuar el ciclo' });
    }
};
exports.continuarCiclo = continuarCiclo;
const toggleEstadoCoachee = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await db_1.default.user.findUnique({ where: { id } });
        if (!usuario) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        const nuevoEstado = !usuario.activo;
        await db_1.default.user.update({
            where: { id },
            data: { activo: nuevoEstado }
        });
        if (!nuevoEstado) {
            await db_1.default.ciclo.updateMany({
                where: { userId: id, activo: true },
                data: { activo: false }
            });
        }
        else {
            const ultimoCiclo = await db_1.default.ciclo.findFirst({
                where: { userId: id },
                orderBy: { id: 'desc' }
            });
            if (ultimoCiclo) {
                await db_1.default.ciclo.update({
                    where: { id: ultimoCiclo.id },
                    data: { activo: true }
                });
            }
        }
        res.json({ message: `Estado actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, activo: nuevoEstado });
    }
    catch (error) {
        console.error('Error al hacer toggle de estado:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.toggleEstadoCoachee = toggleEstadoCoachee;
const dashboardBffService_1 = require("../services/dashboardBffService");
const obtenerMisAvances = async (req, res) => {
    try {
        const { id } = req.params;
        const dashboardData = await (0, dashboardBffService_1.obtenerDashboardBff)(id);
        res.json(dashboardData);
    }
    catch (error) {
        console.error('Error al obtener mis avances:', error);
        res.status(500).json({ message: 'Error interno del servidor al cargar avances' });
    }
};
exports.obtenerMisAvances = obtenerMisAvances;
const usarComodin = async (req, res) => {
    try {
        const { id: userId, cicloId } = req.params;
        const { fechaObjetivo } = req.body;
        if (!fechaObjetivo) {
            res.status(400).json({ message: 'Se requiere fechaObjetivo.' });
            return;
        }
        const ciclo = await db_1.default.ciclo.findUnique({
            where: { id: cicloId },
            include: { tareas: true }
        });
        if (!ciclo) {
            res.status(404).json({ message: 'Ciclo no encontrado.' });
            return;
        }
        // 1. Validar Saldo
        const totalComodines = Math.round((ciclo.totalDias / 20) * 3) || 3;
        if (ciclo.comodinesUsados >= totalComodines) {
            res.status(400).json({ message: 'No te quedan comodines disponibles.' });
            return;
        }
        // 2. Validar Fecha Objetivo
        const objetivo = new Date(fechaObjetivo);
        objetivo.setHours(0, 0, 0, 0);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        // Calcular día hábil anterior a "hoy"
        const diaAnterior = new Date(hoy);
        do {
            diaAnterior.setDate(diaAnterior.getDate() - 1);
        } while (diaAnterior.getDay() === 0 || diaAnterior.getDay() === 6);
        const isHoy = objetivo.getTime() === hoy.getTime();
        const isAyer = objetivo.getTime() === diaAnterior.getTime();
        if (!isHoy && !isAyer) {
            res.status(400).json({ message: 'El comodín solo se puede usar para hoy o el día hábil anterior.' });
            return;
        }
        // 3. Obtener Tareas Activas y Excusarlas
        const isFriday = objetivo.getDay() === 5;
        const tareasParaExcusar = ciclo.tareas.filter(t => {
            if (!t.activa)
                return false;
            if (t.periodicidad === 'DIARIA')
                return true;
            if (t.periodicidad === 'SEMANAL' && isFriday)
                return true;
            return false;
        });
        for (const tarea of tareasParaExcusar) {
            await db_1.default.cumplimiento.upsert({
                where: {
                    tareaId_userId_fecha: {
                        tareaId: tarea.id,
                        userId,
                        fecha: objetivo
                    }
                },
                update: {
                    completada: true,
                    aprendizajeDia: 'Excusado por Comodín'
                },
                create: {
                    tareaId: tarea.id,
                    userId,
                    fecha: objetivo,
                    completada: true,
                    aprendizajeDia: 'Excusado por Comodín'
                }
            });
        }
        // 4. Actualizar contador de comodines
        await db_1.default.ciclo.update({
            where: { id: cicloId },
            data: { comodinesUsados: { increment: 1 } }
        });
        res.json({ message: 'Comodín usado exitosamente.', comodinesUsados: ciclo.comodinesUsados + 1 });
    }
    catch (error) {
        console.error('Error al usar comodín:', error);
        res.status(500).json({ message: 'Error interno del servidor al usar el comodín.' });
    }
};
exports.usarComodin = usarComodin;
