import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import coacheeRoutes from './routes/coacheeRoutes';
import frasesRoutes from './routes/frases.routes';
import diagnosticoRoutes from './routes/diagnosticoRoutes';
import iaRoutes from './routes/iaRoutes';
import contratoRoutes from './routes/contratoRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Montaje de rutas
app.use('/api/auth', authRoutes);
app.use('/api/coachees', coacheeRoutes);
app.use('/api/frases', frasesRoutes);
app.use('/api/diagnostico', diagnosticoRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/contratos', contratoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'InnovaAgile API running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});