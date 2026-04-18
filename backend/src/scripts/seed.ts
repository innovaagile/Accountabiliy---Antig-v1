import prisma from '../config/db';
import { hashPassword } from '../utils/auth';

(async () => {
  try {
    const passwordHash = await hashPassword('admin123');

    await prisma.user.upsert({
      where: { email: 'admin@innovaagile.com' },
      update: {},
      create: {
        nombre: 'Admin',
        apellido: 'InnovaAgile',
        email: 'admin@innovaagile.com',
        passwordHash,
        role: 'ADMIN',
      },
    });

    console.log('✅ Seeder ejecutado con éxito.');
    console.log('Usuario: admin@innovaagile.com');
    console.log('Contraseña: admin123');
  } catch (error) {
    console.error('❌ Error ejecutando el seeder:', error);
  } finally {
    await prisma.$disconnect();
  }
})();