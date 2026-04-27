import prisma from '../config/db';
import { calcularNivel } from './gamificationService';

const diasSemanas = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

const obtenerMedallasDefinidas = () => [
    { id: "1", nombre: "Primeros Pasos", descripcion: "Lograste romper la inercia y completaste las tareas de tu primer día.", icono: "Star", colorBase: "bg-blue-50", colorIcono: "text-blue-500" },
    { id: "2", nombre: "Semana de Fuego", descripcion: "Alcanzaste una racha de 7 días ininterrumpidos.", icono: "Flame", colorBase: "bg-orange-50", colorIcono: "text-orange-500" },
    { id: "3", nombre: "Constancia Pura", descripcion: "Completaste el 80% de tus tareas en la primera mitad del ciclo.", icono: "Activity", colorBase: "bg-[#eef7d5]", colorIcono: "text-[#A9D42C]" },
    { id: "4", nombre: "Maestro del Hábito", descripcion: "Conseguiste completar todas tus tareas diarias y semanales durante 14 días.", icono: "Shield", colorBase: "bg-purple-50", colorIcono: "text-purple-500" },
    { id: "5", nombre: "Leyenda", descripcion: "Terminaste el ciclo con el 100% de compromiso y sin usar comodines.", icono: "Trophy", colorBase: "bg-yellow-50", colorIcono: "text-yellow-500" }
];

export const generarHeatmap = async (cicloId: string, fechaInicio: Date, fechaFin: Date) => {
    const tareas = await prisma.tarea.findMany({
        where: { cicloId },
        include: { cumplimientos: true }
    });

    const heatmapDays = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Todos los días del ciclo (como pidió el user, TODO EL CICLO)
    let baseDate = new Date(fechaInicio);
    baseDate.setHours(0,0,0,0);
    
    // Para no iterar infinitamente, limitamos a la fecha de fin o 100 días
    let i = 0;
    while (baseDate <= fechaFin && i < 100) {
        // Ignorar fines de semana para simplificar si es plan 4S, pero si queremos ser exactos:
        if (baseDate.getDay() !== 0 && baseDate.getDay() !== 6) {
            const dateStr = baseDate.toISOString().split('T')[0];
            const isToday = baseDate.getTime() === today.getTime();
            const isPast = baseDate < today;
            const isFuture = baseDate > today;
            
            // Total tareas debidas este dia
            let total = 0;
            let realizadas = 0;
            
            for (const tarea of tareas) {
                // Simplificación de tareas: asumir todas aplican si no tienen diaSemana o es mensual
                // TODO: lógica precisa según periodicidad
                total++;
                
                const cumplido = tarea.cumplimientos.find(c => {
                    const cDate = new Date(c.fecha);
                    cDate.setHours(0,0,0,0);
                    return cDate.getTime() === baseDate.getTime() && c.completada;
                });
                
                if (cumplido) realizadas++;
            }
            
            const porcentaje = total > 0 ? (isFuture ? 0 : Math.round((realizadas / total) * 100)) : 0;
            
            let colorClass = 'bg-gray-200';
            if (!isFuture && total > 0) {
                if (porcentaje < 33) colorClass = 'bg-red-500';
                else if (porcentaje <= 66) colorClass = 'bg-yellow-400';
                else colorClass = 'bg-[#A9D42C]';
            }

            heatmapDays.push({
                date: new Date(baseDate),
                labelDia: diasSemanas[baseDate.getDay()],
                labelNum: baseDate.getDate(),
                isPast,
                isToday,
                isFuture,
                total,
                realizadas,
                porcentaje,
                colorClass
            });
        }
        baseDate.setDate(baseDate.getDate() + 1);
        i++;
    }

    const pastAndToday = heatmapDays.filter(d => d.isPast || d.isToday);
    const realizadasTotales = pastAndToday.reduce((acc, d) => acc + d.realizadas, 0);
    const tareasDebidasTotales = pastAndToday.reduce((acc, d) => acc + d.total, 0);
    const porcentajeCompromiso = tareasDebidasTotales > 0 ? Math.round((realizadasTotales / tareasDebidasTotales) * 100) : 0;

    return { heatmapDays, porcentajeCompromiso };
};

export const calcularAnalisisTareas = async (cicloId: string) => {
    const tareas = await prisma.tarea.findMany({
        where: { cicloId },
        include: { cumplimientos: true }
    });
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    const isFriday = today.getDay() === 5;

    const analisis = tareas.map(t => {
        const completadaHoy = !!t.cumplimientos.find(c => {
            const cDate = new Date(c.fecha);
            cDate.setHours(0,0,0,0);
            return cDate.getTime() === today.getTime() && c.completada;
        });
        
        // Mocking/Aproximando totals para la tabla
        const cicloRealizadas = t.cumplimientos.filter(c => c.completada).length;
        const cicloTotal = 20; // Aproximado para dias habiles
        
        // Semana: ultimos 7 dias
        const limitSemana = new Date(today);
        limitSemana.setDate(today.getDate() - 7);
        const semanaRealizadas = t.cumplimientos.filter(c => c.completada && new Date(c.fecha) >= limitSemana).length;
        const semanaTotal = t.periodicidad === 'SEMANAL' ? 1 : 5;

        // Logica exacta para "esHoy" que alimenta la traccion
        let esHoy = false;
        if (!isWeekend) {
            if (t.periodicidad === 'DIARIA') esHoy = true;
            if (t.periodicidad === 'SEMANAL' && isFriday) esHoy = true;
        }

        return {
            id: t.id,
            nombre: t.nombre,
            esHoy,
            fechaProximoDia: 'Pronto',
            completadaHoy,
            semanaRealizadas,
            semanaTotal,
            cicloRealizadas,
            cicloTotal,
            isSemanal: t.periodicidad === 'SEMANAL',
            activa: t.activa
        };
    });
    
    return analisis;
};

export const extraerSabidurias = async (cicloId: string) => {
    const tareas = await prisma.tarea.findMany({
        where: { cicloId },
        include: {
            cumplimientos: {
                where: { 
                    AND: [
                        { aprendizajeDia: { not: null } },
                        { aprendizajeDia: { not: "" } }
                    ]
                },
                orderBy: { fecha: 'asc' }
            }
        }
    });

    return tareas.map(t => ({
        id: t.id,
        nombre: t.nombre,
        reflexiones: t.cumplimientos.map(c => ({
            fecha: new Date(c.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            texto: c.aprendizajeDia
        }))
    }));
};

export const calcularMedallas = async (user: any, cicloInfo: any) => {
    const medallasDefinidas = obtenerMedallasDefinidas();
    let desbloqueadas = user.medallasDesbloqueadas || [];
    let nuevasDesbloqueadas = false;

    // Verificar si se ganan nuevas
    // 1. Primeros Pasos: Si tiene xp > 0 (al menos 1 tarea completada)
    if (user.xpTotal > 0 && !desbloqueadas.includes("1")) {
        desbloqueadas.push("1");
        nuevasDesbloqueadas = true;
    }
    
    // 2. Semana de Fuego: racha >= 7
    if (user.rachaActual >= 7 && !desbloqueadas.includes("2")) {
        desbloqueadas.push("2");
        nuevasDesbloqueadas = true;
    }
    
    // 3. Constancia Pura: 80% en primera mitad (Aproximación si % compromiso > 80 y dia > 10)
    if (cicloInfo && cicloInfo.diaHabilActual > 10 && cicloInfo.porcentajeCompromiso >= 80 && !desbloqueadas.includes("3")) {
        desbloqueadas.push("3");
        nuevasDesbloqueadas = true;
    }
    
    // Guardar si hubo nuevas
    if (nuevasDesbloqueadas) {
        await prisma.user.update({
            where: { id: user.id },
            data: { medallasDesbloqueadas: desbloqueadas }
        });
    }

    return medallasDefinidas.map(m => ({
        ...m,
        ganada: desbloqueadas.includes(m.id)
    }));
};

export const obtenerDashboardBff = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            ciclos: {
                where: { estado: 'ACTIVO', activo: true },
                orderBy: { fechaInicio: 'desc' },
                take: 1
            }
        }
    });

    if (!user) throw new Error("Usuario no encontrado");

    const activeCiclo = user.ciclos[0];
    let heatmapInfo: { heatmapDays: any[]; porcentajeCompromiso: number } = { heatmapDays: [], porcentajeCompromiso: 0 };
    let analisisTareas: any[] = [];
    let sabidurias: any[] = [];
    let diasHabiles = 0;

    if (activeCiclo) {
        // Cálculo de días hábiles transcurridos (Días que llevas del ciclo)
        let currentDate = new Date(activeCiclo.fechaInicio);
        currentDate.setHours(0,0,0,0);
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        while (currentDate <= hoy) {
            if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
                diasHabiles++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        (activeCiclo as any).diaHabilActual = diasHabiles;

        heatmapInfo = await generarHeatmap(activeCiclo.id, activeCiclo.fechaInicio, activeCiclo.fechaFin);
        analisisTareas = await calcularAnalisisTareas(activeCiclo.id);
        sabidurias = await extraerSabidurias(activeCiclo.id);
    }

    const medallas = await calcularMedallas(user, { 
        diaHabilActual: diasHabiles || 1, 
        porcentajeCompromiso: heatmapInfo.porcentajeCompromiso 
    });

    const nivelDetalle = calcularNivel(user.xpTotal || 0);

    // Calcular hoy (Tracción de Hoy)
    const tareasActivas = analisisTareas.filter(t => t.activa);
    const tareasHoy = tareasActivas.filter(t => t.esHoy).length;
    const completadasHoy = tareasActivas.filter(t => t.esHoy && t.completadaHoy).length;

    /**
     * Calcula la racha de días hábiles seguidos con al menos 1 tarea realizada.
     * @param heatmapDays Arreglo de días generados para el mapa de calor
     * @returns Número entero con la racha actual
     */
    const calcularRachaReal = (heatmapDays: any[]): number => {
      let racha = 0;
      
      // 1. Filtrar solo los días evaluables: los que ya pasaron y el día de hoy
      const diasEvaluables = heatmapDays.filter(dia => dia.isPast || dia.isToday);
      
      // 2. Ordenar cronológicamente inverso (de hoy hacia el pasado)
      const diasEnReversa = [...diasEvaluables].reverse();

      for (const dia of diasEnReversa) {
        if (dia.realizadas > 0) {
          // Si hizo al menos 1 tarea, suma a la racha
          racha++;
        } else if (dia.isPast) {
          // Si el día YA PASÓ y no hizo tareas, la racha se rompe definitivamente
          break;
        } else if (dia.isToday && dia.realizadas === 0) {
          // Si es HOY y aún no hace tareas, no rompe la racha de ayer (aún tiene tiempo), 
          // pero tampoco suma. Continuamos evaluando el día de ayer.
          continue;
        }
      }
      
      return racha;
    };

    const rachaActual = calcularRachaReal(heatmapInfo.heatmapDays);

    return {
        id: user.id,
        nombre: user.nombre,
        servicioContratado: user.servicioContratado,
        xpTotal: user.xpTotal,
        rachaActual: rachaActual,
        nivelDetalle,
        activeCiclo,
        heatmapDays: heatmapInfo.heatmapDays,
        porcentajeCompromiso: heatmapInfo.porcentajeCompromiso,
        tareasMock: analisisTareas,
        sabiduriasMock: sabidurias,
        medallasMock: medallas,
        comodinesUsados: activeCiclo?.comodinesUsados || 0,
        totalComodines: activeCiclo ? Math.round((activeCiclo.totalDias / 20) * 3) : 3,
        completadasHoy,
        tareasHoy
    };
};
