import cron from 'node-cron';
import prisma from '../config/db';
import { sendTemplateMessage } from './whatsappService';

export const startCronJobs = () => {
  // Ejecutar todos los días a las 09:00 AM (hora de Chile)
  cron.schedule('0 9 * * *', async () => {
    console.log('⏳ Ejecutando CRON de Resumen Diario (09:00 AM Chile)...');
    
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
      console.error('❌ Error en la ejecución del CRON:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Santiago'
  });

  console.log('🕒 Servicio CRON inicializado.');
};
