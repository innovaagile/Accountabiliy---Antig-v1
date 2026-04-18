import { Request, Response } from 'express';
import prisma from '../config/db';

export const getCoachees = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachees = await prisma.user.findMany({
      where: { role: 'COACHEE' },
      select: { id: true, nombre: true, apellido: true, email: true, pais: true, telefono: true, activo: true }
    });
    const formatted = coachees.map(c => ({
      id: c.id,
      nombre: `${c.nombre} ${c.apellido}`,
      email: c.email,
      pais: c.pais || 'No especificado',
      telefono: c.telefono || 'No especificado',
      plan: 'SPRINT DIGITAL 4S', 
      frecuencia: 'CADA COMPROMISO', 
      estado: c.activo ? 'Activo' : 'Inactivo',
    }));
    res.json(formatted);
  } catch (error) {
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