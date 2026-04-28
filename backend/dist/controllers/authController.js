"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cambiarPassword = exports.login = void 0;
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../utils/auth");
const bcrypt_1 = __importDefault(require("bcrypt"));
const login = async (req, res) => {
    const { email, password } = req.body;
    const emailLower = email.toLowerCase();
    try {
        const user = await db_1.default.user.findUnique({
            where: { email: emailLower },
            include: { diagnostico: true }
        });
        if (!user || user.activo === false) {
            res.status(401).json({ message: 'Credenciales inválidas o cuenta inactiva' });
            return;
        }
        const isMatch = await (0, auth_1.comparePassword)(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: 'Credenciales inválidas o cuenta inactiva' });
            return;
        }
        const token = (0, auth_1.generateToken)(user.id, user.role);
        res.json({
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                role: user.role,
                hasCompletedDiagnostic: user.role === 'ADMIN' ? true : (user.hasDiagnostico === true),
                hasDiagnostico: user.role === 'ADMIN' ? true : (user.hasDiagnostico === true),
                contratoFirmado: user.contratoFirmado === true,
                debeCambiarPassword: user.debeCambiarPassword
            }
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};
exports.login = login;
const cambiarPassword = async (req, res) => {
    const { userId, passwordActual, nuevaPassword } = req.body;
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            res.status(404).json({ message: 'Usuario no encontrado' });
            return;
        }
        const isMatch = await (0, auth_1.comparePassword)(passwordActual, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ message: 'La contraseña actual es incorrecta' });
            return;
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(nuevaPassword, salt);
        await db_1.default.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                debeCambiarPassword: false
            }
        });
        res.json({ message: 'Contraseña actualizada correctamente' });
    }
    catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor al cambiar contraseña' });
    }
};
exports.cambiarPassword = cambiarPassword;
