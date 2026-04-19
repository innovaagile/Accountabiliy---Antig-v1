import { Request, Response } from 'express';
import prisma from '../config/db';

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
          include: { tareas: true }
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
    
    const newCoachee = await prisma.user.create({
      data: {
        nombre, apellido, email,
        passwordHash: '$2b$10$dummyHashDePrueba123',
        role: 'COACHEE',
        pais, telefono: `+56 ${telefono}`,
        empresa, cargo,
        servicioContratado: servicio,
        frecuenciaRecordatorios: frecuencia,
      }
    });

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