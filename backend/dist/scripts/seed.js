"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../utils/auth");
(async () => {
    try {
        const passwordHash = await (0, auth_1.hashPassword)('admin123');
        await db_1.default.user.upsert({
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
    }
    catch (error) {
        console.error('❌ Error ejecutando el seeder:', error);
    }
    finally {
        await db_1.default.$disconnect();
    }
})();
