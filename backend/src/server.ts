import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import coacheeRoutes from './routes/coacheeRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Montaje de rutas
app.use('/api/auth', authRoutes);
app.use('/api/coachees', coacheeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'InnovaAgile API running' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});