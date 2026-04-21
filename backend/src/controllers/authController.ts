import { Request, Response } from 'express';
import prisma from '../config/db';
import { comparePassword, generateToken } from '../utils/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { diagnostico: true }
    });

    if (!user || user.activo === false) {
      res.status(401).json({ message: 'Credenciales inválidas o cuenta inactiva' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      res.status(401).json({ message: 'Credenciales inválidas o cuenta inactiva' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        hasCompletedDiagnostic: user.diagnostico?.estado === 'COMPLETADO'
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};