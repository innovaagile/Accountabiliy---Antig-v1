import { Request, Response } from 'express';
import prisma from '../config/db';
import { calcularXPObtenida } from '../services/gamificationService';

export const crearTarea = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cicloId } = req.params;
    const {
      nombre,
      momento,
      accion,
      periodicidad,
      diasSemana,
      fechasMensuales,
      horaSugerida,
      horaProgramada,
      icono
    } = req.body;

    if (periodicidad === 'MENSUAL' && fechasMensuales) {
      if (Array.isArray(fechasMensuales) && fechasMensuales.length > 3) {
        res.status(400).json({ message: 'Las tareas mensuales admiten un máximo de 3 fechas.' });
        return;
      }
    }

    const nuevaTarea = await prisma.tarea.create({
      data: {
        cicloId,
        nombre,
        momento,
        accion,
        periodicidad,
        diasSemana: diasSemana ? diasSemana : undefined,
        fechasMensuales: fechasMensuales ? fechasMensuales : undefined,
        horaSugerida,
        horaProgramada,
        icono: icono || 'CheckCircle',
        activa: true
      }
    });

    res.status(201).json(nuevaTarea);
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const actualizarTarea = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tareaId } = req.params;
    const {
      nombre,
      momento,
      accion,
      periodicidad,
      diasSemana,
      fechasMensuales,
      horaSugerida,
      horaProgramada,
      icono
    } = req.body;

    if (periodicidad === 'MENSUAL' && fechasMensuales) {
      if (Array.isArray(fechasMensuales) && fechasMensuales.length > 3) {
        res.status(400).json({ message: 'Las tareas mensuales admiten un máximo de 3 fechas.' });
        return;
      }
    }

    const tareaActualizada = await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        nombre,
        momento,
        accion,
        periodicidad,
        diasSemana,
        fechasMensuales,
        horaSugerida,
        horaProgramada,
        icono
      }
    });

    res.json(tareaActualizada);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const eliminarTarea = async (req: Request, res: Response): Promise<void> => {
  try {
    // Tarea 2: Confirmar recepción de los tres IDs
    const { id, cicloId, tareaId } = req.params;
    
    // Verificamos que al menos venga el tareaId
    if (!tareaId) {
       res.status(400).json({ message: 'Se requiere tareaId' });
       return;
    }

    await prisma.tarea.delete({
      where: { id: tareaId }
    });
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const registrarCumplimiento = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: userId, tareaId } = req.params;
    const { completada, aprendizajeDia } = req.body;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Obtener tarea y usuario para gamificación
    const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!tarea || !user) {
      res.status(404).json({ message: 'Tarea o Usuario no encontrado.' });
      return;
    }

    // Buscar si ya existía el cumplimiento
    const cumplimientoPrevio = await prisma.cumplimiento.findUnique({
      where: {
        tareaId_userId_fecha: { tareaId, userId, fecha: hoy }
      }
    });

    const wasCompleted = cumplimientoPrevio?.completada || false;

    const cumplimiento = await prisma.cumplimiento.upsert({
      where: {
        tareaId_userId_fecha: {
          tareaId,
          userId,
          fecha: hoy
        }
      },
      update: {
        completada: completada !== undefined ? completada : undefined,
        aprendizajeDia: aprendizajeDia !== undefined ? aprendizajeDia : undefined
      },
      create: {
        tareaId,
        userId,
        fecha: hoy,
        completada: completada || false,
        aprendizajeDia: aprendizajeDia || ''
      }
    });

    // --- GAMIFICACIÓN ---
    // Si la tarea se acaba de marcar como completada (y no lo estaba antes)
    if (completada && !wasCompleted) {
      const xpGanada = calcularXPObtenida(tarea, cumplimiento, user.rachaActual);
      
      await prisma.user.update({
        where: { id: userId },
        data: { 
          xpTotal: { increment: xpGanada },
          rachaActual: { increment: 1 } // Sumamos +1 a la racha por hacer "al menos 1 tarea"
        }
      });
    }

    res.json(cumplimiento);
  } catch (error) {
    console.error('Error al registrar cumplimiento:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
