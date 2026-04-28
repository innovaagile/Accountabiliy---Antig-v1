const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.user.updateMany({ where: { cargo: 'Manager' }, data: { cargo: 'Ejecutivo' } });
    console.log('DB updated');
}

main().finally(() => prisma.$disconnect());
