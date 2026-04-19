import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';
import { enviarCorreoBienvenida, enviarCorreoReseteo, enviarCorreoContrato } from '../utils/emailService';
import { calcularFechaFinHabil } from '../utils/dateUtils';

export const obtenerCoachees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, empresa, cargo, servicio, estado } = req.query;

    let whereClause: any = { role: 'COACHEE' };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: String(search), mode: 'insensitive' } },
        { apellido: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    
    if (empresa) whereClause.empresa = String(empresa);
    if (cargo) whereClause.cargo = String(cargo);
    
    // Asumimos lógica de negocio que valida con los ciclos
    if (servicio) {
      whereClause.ciclos = { some: { producto: String(servicio) } };
    }
    
    if (estado !== undefined) {
      whereClause.activo = estado === 'true' || estado === 'activo';
    }

    const coachees = await prisma.user.findMany({
      where: whereClause,
      include: {
        ciclos: true,
        contracts: true
      }
    });

    const formatted = coachees.map((c: any) => ({
      id: c.id,
      nombre: `${c.nombre} ${c.apellido}`,
      email: c.email,
      pais: c.pais || 'No especificado',
      telefono: c.telefono || 'No especificado',
      empresa: c.empresa,
      cargo: c.cargo,
      plan: c.servicioContratado || 'No asignado', 
      frecuencia: c.frecuenciaRecordatorios || 'No especificada', 
      estado: c.activo ? 'Activo' : 'Inactivo',
      activo: c.activo,
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error al obtener coachees:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const obtenerCoacheePorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coachee = await prisma.user.findFirst({
      where: { 
        id, 
        role: 'COACHEE' 
      },
      include: {
        ciclos: {
          include: { tareas: true },
          orderBy: { id: 'desc' }
        },
        contracts: true
      }
    });
    
    if (!coachee) {
      res.status(404).json({ message: 'Coachee no encontrado' });
      return;
    }
    
    res.json(coachee);
  } catch (error) {
    console.error('Error al obtener coachee por id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const createCoachee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, email, pais, telefono, empresa, cargo, servicio, frecuencia } = req.body;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) { res.status(400).json({ message: 'El coachee ya existe' }); return; }
    
    const tempPassword = Math.random().toString(36).slice(-8);
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

    const newCoachee = await prisma.user.create({
      data: {
        nombre, apellido, email,
        passwordHash: passwordHash,
        role: 'COACHEE',
        pais, telefono: `+56 ${telefono}`,
        empresa, cargo,
        servicioContratado: servicio,
        frecuenciaRecordatorios: frecuencia,
      }
    });

    await enviarCorreoBienvenida(email, nombre, tempPassword);

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
  } catch (error) {
    res.status(500).json({ message: 'Error creando coachee' });
  }
};

export const actualizarCoachee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, pais, telefono, empresa, cargo, activo, servicioContratado, frecuenciaRecordatorios, hasDiagnostico } = req.body;
    
    const coacheeActualizado = await prisma.user.update({
      where: { id },
      data: {
        nombre,
        apellido,
        email,
        pais,
        telefono,
        empresa,
        cargo,
        activo,
        servicioContratado,
        frecuenciaRecordatorios,
        hasDiagnostico
      }
    });
    
    res.json(coacheeActualizado);
  } catch (error) {
    console.error('Error al actualizar coachee:', error);
    res.status(500).json({ message: 'Error interno al actualizar coachee' });
  }
};

export const eliminarCoachee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Coachee eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar coachee:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const resetearPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Generar contraseña temporal de 8 caracteres alfanuméricos
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Hashear la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(tempPassword, saltRounds);
    
    // Actualizar base de datos
    const coachee = await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    // Enviar email falso estructurado
    await enviarCorreoReseteo(coachee.email, coachee.nombre, tempPassword);

    res.json({ message: 'Contraseña reseteada con éxito' });
  } catch (error) {
    console.error('Error al resetear password:', error);
    res.status(500).json({ message: 'Error interno del servidor al resetear la clave' });
  }
};

export const enviarContrato = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coachee = await prisma.user.findUnique({ where: { id } });
    if (!coachee) {
        res.status(404).json({ message: 'Coachee no encontrado' });
        return;
    }

    await enviarCorreoContrato(coachee.email, coachee.nombre);

    res.json({ message: 'Contrato enviado exitosamente' });
  } catch (error) {
    console.error('Error al enviar contrato:', error);
    res.status(500).json({ message: 'Error interno del servidor al enviar contrato' });
  }
};

export const crearCicloInteligente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;
    let fechaInicioObj = new Date();
    if (body && body.fechaInicio) {
      fechaInicioObj = new Date(body.fechaInicio);
    }

    const coachee = await prisma.user.findUnique({
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
    if (servicioContratado === 'Sprint Digital 4S') {
      diasHabiles = 20;
    } else if (servicioContratado === 'Executive Mastery') {
      diasHabiles = 40;
    } else {
      res.status(400).json({ message: 'Servicio contratado inválido o no soportado' });
      return;
    }

    const fechaFin = body.fechaFin ? new Date(body.fechaFin) : calcularFechaFinHabil(fechaInicioObj, diasHabiles);
    
    await prisma.ciclo.updateMany({
        where: { userId: id },
        data: { estado: 'COMPLETADO', activo: false }
    });
    
    const countCiclos = await prisma.ciclo.count({ where: { userId: id } });
    const nombreCiclo = body.nombre ? body.nombre.replace(' (Continuación)', '') : `Ciclo ${countCiclos + 1}`;

    const nuevoCiclo = await prisma.ciclo.create({
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
  } catch (error) {
    console.error('Error al crear ciclo inteligente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const eliminarCiclo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cicloId } = req.params;
        await prisma.ciclo.delete({ where: { id: cicloId } });
        res.json({ message: 'Ciclo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar ciclo:', error);
        res.status(500).json({ message: 'Error interno al eliminar ciclo' });
    }
};

export const actualizarCiclo = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cicloId } = req.params;
        const { nombre, fechaInicio, fechaFin } = req.body;
        
        await prisma.ciclo.update({
            where: { id: cicloId },
            data: {
                nombre,
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(fechaFin)
            }
        });
        res.json({ message: 'Ciclo actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar ciclo:', error);
        res.status(500).json({ message: 'Error interno al actualizar ciclo' });
    }
};

export const continuarCiclo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;
    let fechaInicioObj = new Date();
    if (body && body.fechaInicio) {
      fechaInicioObj = new Date(body.fechaInicio);
    }

    const coachee = await prisma.user.findUnique({
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
    await prisma.ciclo.updateMany({
        where: { userId: id },
        data: { estado: 'COMPLETADO', activo: false }
    });

    let diasHabiles = 0;
    if (servicioContratado === 'Sprint Digital 4S') {
      diasHabiles = 20;
    } else if (servicioContratado === 'Executive Mastery') {
      diasHabiles = 40;
    } else {
      res.status(400).json({ message: 'El servicio contratado no soporta la creación autocalculada de este ciclo continuo.' });
      return;
    }

    const fechaFin = calcularFechaFinHabil(fechaInicioObj, diasHabiles);
    const countCiclos = await prisma.ciclo.count({ where: { userId: id } });
    const nombreCiclo = body.nombre ? body.nombre.replace(' (Continuación)', '') : `Ciclo ${countCiclos + 1}`;

    const nuevoCiclo = await prisma.ciclo.create({
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
            const tareasNuevas = tareasPrevias.map((t: any) => ({
                cicloId: nuevoCiclo.id,
                nombre: t.nombre,
                descripcion: t.descripcion,
                periodicidad: t.periodicidad,
                horaProgramada: t.horaProgramada,
                icono: t.icono,
                activa: true
            }));
            
            await prisma.tarea.createMany({
                data: tareasNuevas
            });
        }
    }

    res.status(201).json(nuevoCiclo);
  } catch (error) {
    console.error('Error al continuar ciclo:', error);
    res.status(500).json({ message: 'Error interno del servidor al continuar el ciclo' });
  }
};