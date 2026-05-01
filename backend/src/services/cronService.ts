import cron from 'node-cron';
import prisma from '../config/db';
import { sendTemplateMessage } from './whatsappService';

export const startCronJobs = () => {
  // Ejecutar temporalmente a las 19:19 (hora de Chile) para prueba de fuego
  cron.schedule('19 19 * * *', async () => {
    console.log('⏳ Ejecutando CRON de Resumen Diario (Prueba 19:19 Chile)...');
    
    try {
      const coachees = await prisma.user.findMany({
        where: {
          role: 'COACHEE',
          activo: true,
          telefono: { not: null },
          OR: [
            { frecuenciaRecordatorios: 'Una vez al día' },
            { frecuenciaRecordatorios: null }
          ]
        }
      });

      console.log(`✅ Se encontraron ${coachees.length} coachees para el resumen diario.`);

      for (const coachee of coachees) {
        if (!coachee.telefono) continue;

        try {
          // Ajusta los componentes según lo que requiera la plantilla resumen_diario
          const components = [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: coachee.nombre }
              ]
            }
          ];

          await sendTemplateMessage(coachee.telefono, 'resumen_diario', components);
          console.log(`🚀 Resumen diario enviado a ${coachee.nombre} (${coachee.telefono})`);
        } catch (error: any) {
          console.error(`❌ Error enviando resumen a ${coachee.nombre}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error en la ejecución del CRON de resumen diario:', error);
    }
  }, {
    timezone: 'America/Santiago'
  });

  // Ejecutar cada minuto para revisar tareas individuales que vencen en 10 minutos
  cron.schedule('* * * * *', async () => {
    try {
      // 1. Obtener la hora actual + 10 minutos en la zona horaria de Chile
      const targetDate = new Date(Date.now() + 10 * 60000);
      const formatter = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      // Intl format "HH:mm"
      const parts = formatter.formatToParts(targetDate);
      const targetHour = parts.find(p => p.type === 'hour')?.value;
      const targetMinute = parts.find(p => p.type === 'minute')?.value;
      const targetTimeStr = `${targetHour}:${targetMinute}`;

      // 2. Buscar tareas programadas para esa hora exacta
      const tareas = await prisma.tarea.findMany({
        where: {
          activa: true,
          horaProgramada: targetTimeStr,
          ciclo: {
            activo: true,
            user: {
              activo: true,
              telefono: { not: null },
              frecuenciaRecordatorios: {
                notIn: ['Una vez al día']
                // Dependiendo del valor exacto en BD, excluimos la opción agrupada y los nulls por fallback
              },
              // Aseguramos excluir null explícitamente si se asume fallback "Una vez al día"
            }
          }
        },
        include: {
          ciclo: {
            include: { user: true }
          }
        }
      });

      // Filtramos en memoria los usuarios con frecuencia null ya que no los podíamos excluir del todo arriba fácilmente con notIn si prisma no lo toma bien
      const tareasValidas = tareas.filter(t => t.ciclo.user.frecuenciaRecordatorios !== null);

      if (tareasValidas.length > 0) {
        console.log(`⏳ [CRON 10-MIN] Se encontraron ${tareasValidas.length} tareas para las ${targetTimeStr}`);
      }

      for (const tarea of tareasValidas) {
        const user = tarea.ciclo.user;
        if (!user.telefono) continue;

        try {
          const components = [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: user.nombre },
                { type: 'text', text: tarea.nombre } // El nombre de la tarea para el template
              ]
            }
          ];

          await sendTemplateMessage(user.telefono, 'recordatorio_tarea', components);
          console.log(`🚀 Recordatorio individual enviado a ${user.nombre} para la tarea: ${tarea.nombre}`);
        } catch (error: any) {
          console.error(`❌ Error enviando recordatorio a ${user.nombre}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error en el CRON de recordatorios individuales:', error);
    }
  });

  console.log('🕒 Servicio CRON inicializado.');
};
