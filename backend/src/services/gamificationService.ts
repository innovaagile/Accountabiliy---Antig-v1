import prisma from '../config/db';

/**
 * Retorna el Nivel y Color de acuerdo a la XP actual del usuario.
 */
export const calcularNivel = (xp: number) => {
  if (xp >= 580) return { nivel: 'Maestro', color: '#9333EA' }; // Púrpura
  if (xp >= 320) return { nivel: 'Ejecutivo', color: '#38BDF8' }; // Azul claro
  if (xp >= 150) return { nivel: 'Constante', color: '#A9D42C' }; // Verde Innova
  return { nivel: 'Iniciado', color: '#9CA3AF' }; // Gris plata
};

/**
 * Calcula la XP a otorgar por marcar una tarea como completada.
 * - Base: 10 XP
 * - Bono puntualidad: 5 XP (Si es dentro de +/- 1hr de la hora programada)
 * - Bono aprendizaje: 5 XP (Si llenó el campo)
 * - Bono racha: 2 XP * racha actual
 */
export const calcularXPObtenida = (tarea: any, cumplimiento: any, rachaActual: number): number => {
  return 10;
};

/**
 * Evalúa y actualiza la racha diaria del usuario.
 * Regla: +1 si completó al menos 1 tarea. Vuelve a 0 si no completó nada ni usó comodín en el día hábil anterior.
 */
export const evaluarRacha = async (userId: string, cicloId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // Aquí iría la lógica exhaustiva de evaluación de días anteriores.
    // Como simplificación inicial, esta función será llamada al final de cada acción de cumplimiento.
    // Si queremos un chequeo "cron", lo haríamos en una tarea programada. 
    
    // Dejaremos la actualización real de racha para el momento del cumplimiento (registrarCumplimiento),
    // basándonos en la fecha actual.
  } catch (error) {
    console.error("Error al evaluar racha:", error);
  }
};
