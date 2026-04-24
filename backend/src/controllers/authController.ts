import { Request, Response } from 'express';
import prisma from '../config/db';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';
import bcrypt from 'bcrypt';

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
        hasCompletedDiagnostic: user.role === 'ADMIN' ? true : user.diagnostico?.estado === 'COMPLETADO',
        debeCambiarPassword: user.debeCambiarPassword
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const cambiarPassword = async (req: Request, res: Response): Promise<void> => {
  const { userId, passwordActual, nuevaPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const isMatch = await comparePassword(passwordActual, user.passwordHash);

    if (!isMatch) {
      res.status(401).json({ message: 'La contraseña actual es incorrecta' });
      return;
    }

    let hashedPassword;
    if (typeof hashPassword === 'function') {
      hashedPassword = await hashPassword(nuevaPassword);
    } else {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(nuevaPassword, salt);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash: hashedPassword,
        debeCambiarPassword: false
      }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor al cambiar contraseña' });
  }
};