import { Request, Response } from 'express';
import prisma from '../config/db';

export const obtenerCoacheesActivos = async (req: Request, res: Response): Promise<void> => {
  try {
    const coachees = await prisma.user.findMany({
      where: {
        role: 'COACHEE',
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        cargo: true,
        company: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
    
    // Transformar para que se alinee con `{ id, nombre, email, company: { nombre }, cargo }`
    const result = coachees.map(c => ({
      id: c.id,
      nombre: `${c.nombre} ${c.apellido}`.trim(),
      email: c.email,
      cargo: c.cargo || 'Sin Cargo',
      company: c.company ? { nombre: c.company.nombre } : { nombre: 'Sin Empresa' }
    }));

    res.json(result);
  } catch (error) {
    console.error('Error al obtener coachees activos:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener usuarios' });
  }
};

import { generarHeatmap } from '../services/dashboardBffService';
import { calcularNivel } from '../services/gamificationService';

export const obtenerMetricasConsolidadas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { empresas, cargos, search } = req.query;

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
        company: true,
        ciclos: {
          where: { estado: 'ACTIVO', activo: true },
          orderBy: { fechaInicio: 'desc' },
          take: 1
        }
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    const metricsPromises = coachees.map(async (c) => {
      let consistencia = 0;
      const cicloActivo = c.ciclos[0];
      
      if (cicloActivo) {
        const heatmapInfo = await generarHeatmap(cicloActivo.id, cicloActivo.fechaInicio, cicloActivo.fechaFin);
        consistencia = heatmapInfo.porcentajeCompromiso;
      }

      const nivel = calcularNivel(c.xpTotal || 0);
      const estadoHealth = consistencia >= 70 ? 'On Track' : 'At Risk';

      return {
        id: c.id,
        nombre: `${c.nombre} ${c.apellido}`.trim(),
        email: c.email,
        empresa: c.company?.nombre || 'Sin Empresa',
        cargo: c.cargo || 'Sin Cargo',
        consistencia,
        rango: nivel.nivel,
        estadoHealth
      };
    });

    const result = await Promise.all(metricsPromises);

    res.json(result);
  } catch (error) {
    console.error('Error al obtener métricas consolidadas:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener métricas' });
  }
};
