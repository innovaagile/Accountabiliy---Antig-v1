"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const coacheeRoutes_1 = __importDefault(require("./routes/coacheeRoutes"));
const frases_routes_1 = __importDefault(require("./routes/frases.routes"));
const diagnosticoRoutes_1 = __importDefault(require("./routes/diagnosticoRoutes"));
const iaRoutes_1 = __importDefault(require("./routes/iaRoutes"));
const contratoRoutes_1 = __importDefault(require("./routes/contratoRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Montaje de rutas
app.use('/api/auth', authRoutes_1.default);
app.use('/api/coachees', coacheeRoutes_1.default);
app.use('/api/frases', frases_routes_1.default);
app.use('/api/diagnostico', diagnosticoRoutes_1.default);
app.use('/api/ia', iaRoutes_1.default);
app.use('/api/contratos', contratoRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'InnovaAgile API running' });
});
const db_1 = __importDefault(require("./config/db"));
const startServer = async () => {
    try {
        await db_1.default.$connect();
        console.log('✅ Base de datos conectada exitosamente.');
    }
    catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
    }
    app.listen(port, () => {
        console.log(`✅ Server is running on port ${port}`);
    }).on('error', (err) => {
        console.error('❌ Error en el servidor Express:', err);
    });
};
startServer();
