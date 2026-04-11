import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import bcrypt from 'bcryptjs';
import { initDatabase, queryOne, runSql } from './database';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import tripRoutes from './routes/trips';
import fuelRoutes from './routes/fuel';

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sistema.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await queryOne('SELECT id FROM users WHERE role = $1', ['admin']);
  if (!existing) {
    const hash = bcrypt.hashSync(adminPassword, 12);
    await runSql(
      'INSERT INTO users (name, email, password_hash, role, placa) VALUES ($1, $2, $3, $4, $5)',
      ['Administrador', adminEmail, hash, 'admin', '']
    );
    console.log(`Admin criado: ${adminEmail}`);
  }
}

async function main() {
  await initDatabase();
  await seedAdmin();

  const app = express();
  const PORT = parseInt(process.env.PORT || '3001', 10);

  app.use(helmet());

  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean)
    : ['http://localhost:5173'];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS: origem não permitida'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '1mb' }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
  });
  app.use(limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/fuel', fuelRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
  });

  const server = app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Porta ${PORT} já está em uso. Feche o outro terminal/processo ou altere PORT no arquivo .env.`
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

main().catch(err => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
