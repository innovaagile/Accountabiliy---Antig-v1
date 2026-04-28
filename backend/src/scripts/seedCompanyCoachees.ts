// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Company and Coachees...');

  // 1. Crear Company
  const company = await prisma.company.create({
    data: {
      nombre: 'InnovaAgile Corp',
      descripcion: 'Empresa de prueba para la vista espejo.',
    },
  });

  console.log('Company created:', company.nombre);

  // 2. Crear usuarios COACHEE
  const passwordHash = await bcrypt.hash('password123', 10);
  const rnd = Math.floor(Math.random() * 1000);

  const coachee1 = await prisma.user.create({
    data: {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: `juan.perez${rnd}@innovaagile.com`,
      passwordHash,
      role: 'COACHEE',
      companyId: company.id,
      cargo: 'Desarrollador',
      xpTotal: 250,
      rachaActual: 3,
    },
  });

  const coachee2 = await prisma.user.create({
    data: {
      nombre: 'Ana',
      apellido: 'Gómez',
      email: `ana.gomez${rnd}@innovaagile.com`,
      passwordHash,
      role: 'COACHEE',
      companyId: company.id,
      cargo: 'Diseñadora',
      xpTotal: 120,
      rachaActual: 1,
    },
  });

  console.log('Coachees created:', coachee1.nombre, coachee2.nombre);

  // 3. Crear ciclos y tareas falsas para Juan
  const fechaF = new Date();
  fechaF.setDate(fechaF.getDate() + 20);

  const cicloJuan = await prisma.ciclo.create({
    data: {
      nombre: 'Ciclo Q2 - Juan',
      fechaInicio: new Date(),
      fechaFin: fechaF,
      totalDias: 20,
      userId: coachee1.id,
      activo: true,
    },
  });

  const tareaJuan = await prisma.tarea.create({
    data: {
      nombre: 'Hacer commit diario',
      periodicidad: 'DIARIA',
      cicloId: cicloJuan.id,
    },
  });

  await prisma.cumplimiento.create({
    data: {
      tareaId: tareaJuan.id,
      userId: coachee1.id,
      fecha: new Date(),
      completada: true,
    },
  });

  console.log('Datos de prueba creados exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
