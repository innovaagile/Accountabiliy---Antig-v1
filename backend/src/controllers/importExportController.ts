import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import bcrypt from 'bcryptjs';
import { enviarCorreoBienvenida } from '../utils/emailService';

const prisma = new PrismaClient();

const normalizeService = (rawService: string): string => {
  if (!rawService) return "OTRO_SERVICIO";
  const serviceMap: Record<string, string> = {
    "sprint digital 4s": "SPRINT_4S",
    "sprint 4s": "SPRINT_4S",
    "sprint ejecutivo": "SPRINT_EJECUTIVO",
    "liderazgo agil": "LIDERAZGO_AGIL",
    "liderazgo ágil": "LIDERAZGO_AGIL",
  };
  const cleanInput = rawService.toLowerCase().trim();
  return serviceMap[cleanInput] || "OTRO_SERVICIO";
};

const getFriendlyServiceName = (dbCode: string): string => {
  if (!dbCode) return "Otro Servicio";
  const map: Record<string, string> = {
    "SPRINT_4S": "Sprint Digital 4S",
    "SPRINT_EJECUTIVO": "Sprint Ejecutivo",
    "LIDERAZGO_AGIL": "Liderazgo Ágil",
    "OTRO_SERVICIO": "Otro Servicio",
  };
  return map[dbCode] || dbCode;
};

// TAREA 1: PLANTILLA DE CARGA (Download template)
export const descargarPlantillaImportacion = (req: Request, res: Response) => {
  const wb = xlsx.utils.book_new();
  
  const headers = [
    "Nombre Completo",
    "Email",
    "Teléfono",
    "País",
    "Empresa",
    "Servicio Contratado",
    "Frecuencia de Recordatorio",
    "Nombre de la Tarea",
    "Acción Específica",
    "Descripción",
    "Periodicidad",
    "Días de Aplicación",
    "Hora Sugerida"
  ];
  
  const ws = xlsx.utils.aoa_to_sheet([headers]);
  xlsx.utils.book_append_sheet(wb, ws, "Plantilla Carga");
  
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename="plantilla_carga_masiva.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

// TAREA 1: IMPORTADOR B2B MASIVO (Upload and Process)
export const importarMasivo = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No se subió ningún archivo' });
    return;
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet) as any[];

    // Agrupar filas por Email (o Teléfono si falta email)
    const groupedUsers = new Map<string, any[]>();
    for (const row of rows) {
      const email = row["Email"]?.toString().trim().toLowerCase();
      const telefono = row["Teléfono"]?.toString().trim();
      const identifier = email || telefono;

      if (!identifier) continue; // Ignorar filas sin identificador

      if (!groupedUsers.has(identifier)) {
        groupedUsers.set(identifier, []);
      }
      groupedUsers.get(identifier)?.push(row);
    }

    let usersCreated = 0;
    let tasksCreated = 0;

    for (const [identifier, userRows] of groupedUsers) {
      const firstRow = userRows[0];
      const email = firstRow["Email"]?.toString().trim().toLowerCase() || `${identifier.replace(/\s+/g, '')}@placeholder.com`;
      const nombreCompleto = firstRow["Nombre Completo"]?.toString().trim() || "Usuario";
      const parts = nombreCompleto.split(' ');
      const nombre = parts[0];
      const apellido = parts.slice(1).join(' ') || '';
      const telefono = firstRow["Teléfono"]?.toString().trim() || null;
      const pais = firstRow["País"]?.toString().trim() || null;
      const empresaNombre = firstRow["Empresa"]?.toString().trim() || null;
      const rawServicio = firstRow["Servicio Contratado"]?.toString() || "";
      const servicioContratado = normalizeService(rawServicio);
      let frecuencia = firstRow["Frecuencia de Recordatorio"]?.toString().trim();
      const validFrequencies = ["Diaria", "Días hábiles", "Por cada tarea"];
      if (!validFrequencies.includes(frecuencia)) {
        frecuencia = "Diaria";
      }

      let companyId = null;
      if (empresaNombre) {
        let company = await prisma.company.findFirst({ where: { nombre: { equals: empresaNombre, mode: 'insensitive' } } });
        if (!company) {
          company = await prisma.company.create({ data: { nombre: empresaNombre } });
        }
        companyId = company.id;
      }

      // Check if user exists
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        const passwordTemp = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordTemp, salt);

        user = await prisma.user.create({
          data: {
            nombre,
            apellido,
            email,
            passwordHash,
            role: 'COACHEE',
            telefono,
            pais,
            companyId,
            servicioContratado,
            frecuenciaRecordatorios: frecuencia,
            debeCambiarPassword: true
          }
        });
        usersCreated++;
        
        // Trigger welcome email with pass
        await enviarCorreoBienvenida(email, nombre, passwordTemp);
      } else {
        // Update user if exists
        user = await prisma.user.update({
          where: { email },
          data: {
            telefono: telefono || user.telefono,
            pais: pais || user.pais,
            companyId: companyId || user.companyId,
            servicioContratado: servicioContratado || user.servicioContratado,
            frecuenciaRecordatorios: frecuencia || user.frecuenciaRecordatorios
          }
        });
      }

      // Find or create active Ciclo
      let ciclo = await prisma.ciclo.findFirst({
        where: { userId: user.id, activo: true }
      });

      if (!ciclo) {
        const fechaInicio = new Date();
        const fechaFin = new Date();
        // Skip weekends roughly for a 4 week sprint -> 20 business days -> usually 28 days
        fechaFin.setDate(fechaInicio.getDate() + 27); 

        ciclo = await prisma.ciclo.create({
          data: {
            userId: user.id,
            nombre: 'Ciclo Importado',
            fechaInicio,
            fechaFin,
            producto: servicioContratado,
            estado: 'ACTIVO'
          }
        });
      }

      // Inject array of Tasks
      for (const row of userRows) {
        const taskName = row["Nombre de la Tarea"]?.toString().trim();
        if (!taskName) continue; 

        const periodicidadRaw = row["Periodicidad"]?.toString().trim().toUpperCase() || "DIARIA";
        let enumPeriodicidad: any = "DIARIA";
        let diasSemanaJson: string[] | null = null;

        if (periodicidadRaw.includes("SEMANAL")) {
          enumPeriodicidad = "SEMANAL";
          const diasRaw = row["Días de Aplicación"]?.toString() || "";
          const validDays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sáb", "Dom"];
          
          const parsedDays = diasRaw.split(',').map((d: string) => {
            const cleanD = d.trim();
            // Buscar coincidencia ignorando mayúsculas/minúsculas y acentos si es posible
            // Pero como la regla es estricta, lo intentaremos empatar con la lista oficial.
            const match = validDays.find(v => v.toLowerCase() === cleanD.toLowerCase() || v.toLowerCase() === cleanD.toLowerCase().replace('á','a'));
            return match || null;
          }).filter(Boolean) as string[];

          if (parsedDays.length > 0) {
            diasSemanaJson = parsedDays;
          }
        }
        else if (periodicidadRaw.includes("MENSUAL")) {
          enumPeriodicidad = "MENSUAL";
        }

        let horaSugerida = row["Hora Sugerida"]?.toString().trim() || null;
        if (horaSugerida) {
          const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
          if (!timeRegex.test(horaSugerida)) {
            horaSugerida = null; // Fallback si no cumple el regex militar
          }
        }

        await prisma.tarea.create({
          data: {
            cicloId: ciclo.id,
            nombre: taskName,
            accion: row["Acción Específica"]?.toString().trim() || null,
            descripcion: row["Descripción"]?.toString().trim() || null,
            periodicidad: enumPeriodicidad,
            diasSemana: diasSemanaJson ? diasSemanaJson : undefined,
            horaSugerida: horaSugerida,
            icono: "CheckCircle"
          }
        });
        tasksCreated++;
      }
    }

    res.json({ success: true, message: `Proceso completado. Usuarios creados: ${usersCreated}, Tareas creadas: ${tasksCreated}.` });
  } catch (error) {
    console.error('Error importando:', error);
    res.status(500).json({ error: 'Error procesando el archivo Excel.' });
  }
};

// TAREA 2: EXPORTADOR TRANSACCIONAL
export const exportarTransaccional = async (req: Request, res: Response) => {
  try {
    const { empresa, cargo, desde, hasta } = req.query;

    const whereUser: any = {};
    if (empresa && empresa !== 'Todas') {
      whereUser.company = { nombre: { contains: empresa as string, mode: 'insensitive' } };
    }
    if (cargo && cargo !== 'Todos') {
      whereUser.cargo = { contains: cargo as string, mode: 'insensitive' };
    }

    const whereFecha: any = {};
    if (desde) {
      whereFecha.gte = new Date(desde as string);
    }
    if (hasta) {
      whereFecha.lte = new Date(hasta as string);
    }

    const cumplimientos = await prisma.cumplimiento.findMany({
      where: {
        user: Object.keys(whereUser).length > 0 ? whereUser : undefined,
        fecha: Object.keys(whereFecha).length > 0 ? whereFecha : undefined,
      },
      include: {
        tarea: {
          include: {
            ciclo: true
          }
        },
        user: {
          include: { company: true }
        }
      },
      orderBy: { fecha: 'asc' }
    });

    const formatDateDDMMYYYY = (date: Date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const rows = cumplimientos.map(c => {
      // Calculamos el estado: si no está completada, revisamos si la fecha ya pasó para marcar como Incumplida o Pendiente
      let estado = "Pendiente";
      if (c.completada) {
        estado = "Completada";
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cDate = new Date(c.fecha);
        cDate.setHours(0, 0, 0, 0);
        if (cDate < today) estado = "Incumplida";
      }

      return {
        "Fecha_Registro": formatDateDDMMYYYY(c.fecha),
        "Email": c.user.email,
        "Nombre_Completo": `${c.user.nombre} ${c.user.apellido}`.trim(),
        "Teléfono": c.user.telefono || "",
        "País": c.user.pais || "",
        "Empresa": c.user.company?.nombre || "Sin Empresa",
        "Cargo": c.user.cargo || "",
        "Servicio_Contratado": getFriendlyServiceName(c.user.servicioContratado || "SPRINT_4S"),
        "Frecuencia_Recordatorio": c.user.frecuenciaRecordatorios || "Diaria",
        "Ciclo_Nombre": c.tarea.ciclo.nombre || "Ciclo",
        "Fecha_Inicio_Ciclo": formatDateDDMMYYYY(c.tarea.ciclo.fechaInicio),
        "Fecha_Termino_Ciclo": formatDateDDMMYYYY(c.tarea.ciclo.fechaFin),
        "Nombre_Tarea": c.tarea.nombre,
        "Acción_Específica": c.tarea.accion || "",
        "Descripción_Tarea": c.tarea.descripcion || "",
        "Periodicidad": c.tarea.periodicidad,
        "Hora_Sugerida": c.tarea.horaSugerida || "",
        "Días_Aplicación": c.tarea.diasSemana ? (c.tarea.diasSemana as string[]).join(", ") : "",
        "Estado_Cumplimiento": estado,
        "Aprendizaje_Escrito": c.aprendizajeDia || ""
      };
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, "Transaccional BI");

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="exportacion_transaccional_bi.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error exportando:', error);
    res.status(500).json({ error: 'Error generando exportación' });
  }
};
