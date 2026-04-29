import { Request, Response } from 'express';
import prisma from '../config/db';
import { generarHeatmap, calcularRachaReal, calcularAnalisisTareas } from '../services/dashboardBffService';

export const obtenerMetricasEjecutivas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresas, cargos, search, fechaInicio, fechaFin } = req.query;

    let whereClause: any = { role: 'COACHEE', activo: true };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: String(search), mode: 'insensitive' } },
        { apellido: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    if (empresas) {
      const empresasArr = String(empresas).split(',');
      whereClause.company = { nombre: { in: empresasArr } };
    }

    if (cargos) {
      const cargosArr = String(cargos).split(',');
      whereClause.cargo = { in: cargosArr };
    }

    const coachees = await prisma.user.findMany({
      where: whereClause,
      include: {
        ciclos: {
          where: { estado: 'ACTIVO', activo: true },
          orderBy: { fechaInicio: 'desc' },
          take: 1
        }
      }
    });

    let sumaRacha = 0;
    let sumaConsistencia = 0;
    let countRacha = 0;
    let countConsistencia = 0;

    let histograma = {
      '0-2': 0,
      '3-5': 0,
      '6-9': 0,
      '10+': 0
    };

    let diarias = 0;
    let noDiarias = 0; // Semanales o puntuales

    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    const weeklyBuckets = new Map<number, { total: number, realizadas: number }>();

    const startFilterDate = fechaInicio ? new Date(String(fechaInicio)) : undefined;
    const endFilterDate = fechaFin ? new Date(String(fechaFin)) : undefined;

    const metricsPromises = coachees.map(async (c) => {
      let consistencia = 0;
      const cicloActivo = c.ciclos[0];

      let racha = 0;
      if (cicloActivo) {
        // Fetch tasks to check operational mix
        const tareas = await prisma.tarea.findMany({
            where: { cicloId: cicloActivo.id, activa: true }
        });
        
        tareas.forEach(t => {
            if (t.periodicidad === 'DIARIA') diarias++;
            else noDiarias++;
        });

        const heatmapStart = startFilterDate || cicloActivo.fechaInicio;
        const heatmapEnd = endFilterDate || cicloActivo.fechaFin;

        const heatmapInfo = await generarHeatmap(cicloActivo.id, heatmapStart, heatmapEnd);
        consistencia = heatmapInfo.porcentajeCompromiso;

        sumaConsistencia += consistencia;
        countConsistencia++;
        
        // Calcular racha real dinámicamente como en el BFF
        racha = calcularRachaReal(heatmapInfo.heatmapDays);
      }

      sumaRacha += racha;
      countRacha++;

      if (racha <= 2) histograma['0-2']++;
      else if (racha <= 5) histograma['3-5']++;
      else if (racha <= 9) histograma['6-9']++;
      else histograma['10+']++;

      if (cicloActivo) {
        const heatmapStart = startFilterDate || cicloActivo.fechaInicio;
        const heatmapEnd = endFilterDate || cicloActivo.fechaFin;

        const heatmapInfo = await generarHeatmap(cicloActivo.id, heatmapStart, heatmapEnd);
        heatmapInfo.heatmapDays.forEach(d => {
          if (!d.isFuture && d.date && d.total > 0) {
            const dateStr = new Date(d.date);
            dateStr.setHours(0,0,0,0);
            
            const day = dateStr.getDay();
            const diff = dateStr.getDate() - day + (day === 0 ? -6 : 1); // Lunes
            const startOfWeek = new Date(dateStr);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0,0,0,0);
            
            const timeKey = startOfWeek.getTime();
            
            if (!weeklyBuckets.has(timeKey)) {
                weeklyBuckets.set(timeKey, { total: 0, realizadas: 0 });
            }
            
            const bucket = weeklyBuckets.get(timeKey)!;
            bucket.total += d.total;
            bucket.realizadas += d.realizadas;
          }
        });
      }
    });

    await Promise.all(metricsPromises);

    const rachaPromedio = countRacha > 0 ? Math.round(sumaRacha / countRacha) : 0;
    const compromisoPromedio = countConsistencia > 0 ? Math.round(sumaConsistencia / countConsistencia) : 0;

    const totalTareas = diarias + noDiarias;
    const mixOperativo = totalTareas > 0 
        ? { diarias: Math.round((diarias / totalTareas) * 100), noDiarias: Math.round((noDiarias / totalTareas) * 100) }
        : { diarias: 0, noDiarias: 0 };

    const sortedKeys = Array.from(weeklyBuckets.keys()).sort((a, b) => a - b);
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    const tendenciaSemanal = sortedKeys.map(timeKey => {
      const b = weeklyBuckets.get(timeKey)!;
      const consistencia = b.total > 0 ? Math.round((b.realizadas / b.total) * 100) : 0;
      const date = new Date(timeKey);
      return {
        semana: `Sem ${date.getDate()} ${monthNames[date.getMonth()]}`,
        consistencia
      };
    });

    res.json({
        rachaPromedio,
        compromisoPromedio,
        tendenciaSemanal,
        histogramaRacha: [
            { name: '0-2 días', value: histograma['0-2'] },
            { name: '3-5 días', value: histograma['3-5'] },
            { name: '6-9 días', value: histograma['6-9'] },
            { name: '10+ días', value: histograma['10+'] }
        ],
        mixOperativo: [
            { name: 'Diarias', value: mixOperativo.diarias },
            { name: 'Semanales', value: mixOperativo.noDiarias }
        ]
    });
  } catch (error) {
    console.error('Error al obtener métricas ejecutivas:', error);
    res.status(500).json({ message: 'Error interno al obtener métricas ejecutivas' });
  }
};

export const obtenerDrillDownEjecutivo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // 1. Encontrar al usuario
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

    if (!user || !user.ciclos.length) {
      res.status(404).json({ message: 'Usuario sin ciclo activo' });
      return;
    }

    const cicloUser = user.ciclos[0];
    const analisisUser = await calcularAnalisisTareas(cicloUser.id, cicloUser.fechaInicio, cicloUser.fechaFin);

    // 2. Benchmark: Buscar usuarios con el mismo cargo
    const pares = await prisma.user.findMany({
      where: { 
        cargo: user.cargo,
        id: { not: userId },
        activo: true
      },
      include: {
        ciclos: {
          where: { estado: 'ACTIVO', activo: true },
          orderBy: { fechaInicio: 'desc' },
          take: 1
        }
      }
    });

    // Calcular tareas de pares
    const tareasPares = await Promise.all(pares.map(async p => {
      if (!p.ciclos.length) return [];
      const c = p.ciclos[0];
      const analisis = await calcularAnalisisTareas(c.id, c.fechaInicio, c.fechaFin);
      return analisis;
    }));

    const todasTareasPares = tareasPares.flat();

    const resultado = analisisUser.map(tareaUsuario => {
      // Filtrar tareas de pares que tengan el MISMO NOMBRE
      const tareasMismoNombre = todasTareasPares.filter(t => t.nombre.toLowerCase() === tareaUsuario.nombre.toLowerCase());

      let sumRealizadas = 0;
      let sumTotal = 0;
      
      tareasMismoNombre.forEach(t => {
        sumRealizadas += t.aLaFechaRealizadas;
        sumTotal += t.aLaFechaTotal;
      });

      const consistenciaUsuario = tareaUsuario.aLaFechaTotal > 0 
        ? Math.round((tareaUsuario.aLaFechaRealizadas / tareaUsuario.aLaFechaTotal) * 100) 
        : 0;

      const consistenciaBenchmark = sumTotal > 0 
        ? Math.round((sumRealizadas / sumTotal) * 100) 
        : 0;

      return {
        id: tareaUsuario.id,
        nombre: tareaUsuario.nombre,
        consistenciaUsuario,
        consistenciaBenchmark
      };
    });

    res.json(resultado);

  } catch (error) {
    console.error('Error al obtener drill down:', error);
    res.status(500).json({ message: 'Error interno al obtener drill down' });
  }
};
