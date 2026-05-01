import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import coacheeRoutes from './routes/coacheeRoutes';
import frasesRoutes from './routes/frases.routes';
import diagnosticoRoutes from './routes/diagnosticoRoutes';
import iaRoutes from './routes/iaRoutes';
import contratoRoutes from './routes/contratoRoutes';
import adminRoutes from './routes/adminRoutes';
import webhookRoutes from './routes/webhookRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'https://accountabiliy-antig-v1.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Montaje de rutas
app.use('/api/auth', authRoutes);
app.use('/api/coachees', coacheeRoutes);
app.use('/api/frases', frasesRoutes);
app.use('/api/diagnostico', diagnosticoRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'InnovaAgile API running' });
});

import prisma from './config/db';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Base de datos conectada exitosamente.');
    
    app.listen(port, () => {
      console.log(`✅ Server is running on port ${port}`);
    }).on('error', (err) => {
      console.error('❌ Error en el servidor Express:', err);
    });
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

startServer();