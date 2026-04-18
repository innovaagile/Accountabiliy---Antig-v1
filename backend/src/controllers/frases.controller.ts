import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const obtenerFrases = async (req: Request, res: Response): Promise<void> => {
  try {
    const frases = await prisma.frase.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(frases);
  } catch (error) {
    console.error('Error al obtener frases:', error);
    res.status(500).json({ error: 'Error al obtener frases' });
  }
};

export const crearFrase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { texto, tipo } = req.body;
    
    if (!texto || !tipo) {
      res.status(400).json({ error: 'El texto y el tipo son obligatorios' });
      return;
    }

    const nuevaFrase = await prisma.frase.create({
      data: { texto, tipo },
    });
    
    res.status(201).json(nuevaFrase);
  } catch (error) {
    console.error('Error al crear frase:', error);
    res.status(500).json({ error: 'Error al crear frase' });
  }
};

export const eliminarFrase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const fraseExistente = await prisma.frase.findUnique({
      where: { id }
    });

    if (!fraseExistente) {
      res.status(404).json({ error: 'Frase no encontrada' });
      return;
    }

    await prisma.frase.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Frase eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar frase:', error);
    res.status(500).json({ error: 'Error al eliminar frase' });
  }
};
