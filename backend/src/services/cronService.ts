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
      console.error('❌ Error en la ejecución del CRON:', error);
    }
  }, {
    timezone: 'America/Santiago'
  });

  console.log('🕒 Servicio CRON inicializado.');
};
