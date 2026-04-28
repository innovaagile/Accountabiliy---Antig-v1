"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarFrase = exports.crearFrase = exports.obtenerFrases = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const obtenerFrases = async (req, res) => {
    try {
        const frases = await prisma.frase.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(frases);
    }
    catch (error) {
        console.error('Error al obtener frases:', error);
        res.status(500).json({ error: 'Error al obtener frases' });
    }
};
exports.obtenerFrases = obtenerFrases;
const crearFrase = async (req, res) => {
    try {
        const { texto, tipo } = req.body;
        if (!texto || !tipo) {
            res.status(400).json({ error: 'El texto y el tipo son obligatorios' });
            return;
        }
        const nuevaFrase = await prisma.frase.create({
            data: { texto, tipo },
        });
        res.status(201).json(nuevaFrase);
    }
    catch (error) {
        console.error('Error al crear frase:', error);
        res.status(500).json({ error: 'Error al crear frase' });
    }
};
exports.crearFrase = crearFrase;
const eliminarFrase = async (req, res) => {
    try {
        const { id } = req.params;
        const fraseExistente = await prisma.frase.findUnique({
            where: { id }
        });
        if (!fraseExistente) {
            res.status(404).json({ error: 'Frase no encontrada' });
            return;
        }
        await prisma.frase.delete({
            where: { id }
        });
        res.status(200).json({ message: 'Frase eliminada exitosamente' });
    }
    catch (error) {
        console.error('Error al eliminar frase:', error);
        res.status(500).json({ error: 'Error al eliminar frase' });
    }
};
exports.eliminarFrase = eliminarFrase;
