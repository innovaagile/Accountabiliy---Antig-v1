import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateContractPDF } from '../services/pdfService';
import { enviarContratoPdf } from '../services/emailService';

export const sellarContrato = async (req: Request, res: Response): Promise<void> => {
  try {
    // protect middleware inyecta req.user
    const userId = (req as any).user?.id;
    const { firma, planGenerado } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      return;
    }

    if (!firma || !planGenerado) {
      res.status(400).json({ success: false, message: 'Faltan datos requeridos (firma, planGenerado)' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    // 1. Generar el PDF
    const pdfBuffer = await generateContractPDF(firma, planGenerado);

    // 2. Enviar el correo con el adjunto
    await enviarContratoPdf(user.email, user.nombre, pdfBuffer);

    // 3. Actualizar base de datos del usuario
    await prisma.user.update({
      where: { id: userId },
      data: {
        hasDiagnostico: true,
        contratoFirmado: true
      }
    });

    // 4. Guardar tareas en el ciclo activo
    const cicloActivo = await prisma.ciclo.findFirst({
      where: { userId, activo: true },
      orderBy: { fechaInicio: 'desc' }
    });

    if (cicloActivo && planGenerado) {
      const tareasPromises: any[] = [];

      if (Array.isArray(planGenerado.micro_habitos_diarios)) {
        for (const habito of planGenerado.micro_habitos_diarios) {
          tareasPromises.push(
            prisma.tarea.create({
              data: {
                cicloId: cicloActivo.id,
                nombre: habito.titulo,
                descripcion: habito.medicion,
                momento: habito.disparador,
                accion: habito.accion,
                periodicidad: 'DIARIA',
                activa: true
              }
            })
          );
        }
      }

      if (planGenerado.micro_habito_semanal) {
        const habito = planGenerado.micro_habito_semanal;
        tareasPromises.push(
          prisma.tarea.create({
            data: {
              cicloId: cicloActivo.id,
              nombre: habito.titulo,
              descripcion: habito.medicion,
              momento: habito.disparador,
              accion: habito.accion,
              periodicidad: 'SEMANAL',
              activa: true
            }
          })
        );
      }

      await Promise.all(tareasPromises);
    }

    res.status(200).json({ success: true, message: 'Contrato sellado y enviado exitosamente.', pdfBase64: pdfBuffer.toString('base64') });
  } catch (error: any) {
    console.error('Error al sellar contrato:', error);
    res.status(500).json({ success: false, message: 'Error interno al sellar contrato', error: error.message });
  }
};
