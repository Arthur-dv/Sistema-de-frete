import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, runSql } from '../database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { sanitizeString, sanitizeEmail } from '../utils/sanitize';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', async (_req: Request, res: Response) => {
  const users = await queryAll(
    'SELECT id, name, email, role, placa, active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ users });
});

router.post('/users', async (req: Request, res: Response) => {
  const name = sanitizeString(req.body.name);
  const email = sanitizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role = req.body.role === 'admin' ? 'admin' : 'driver';
  const placa = sanitizeString(req.body.placa);

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    return;
  }

  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    res.status(409).json({ error: 'Email já cadastrado' });
    return;
  }

  const hash = bcrypt.hashSync(password, 12);

  const row = await queryOne(
    'INSERT INTO users (name, email, password_hash, role, placa) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [name, email, hash, role, placa]
  );

  res.status(201).json({
    user: { id: row.id, name, email, role, placa, active: 1 },
  });
});

router.put('/users/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const user = await queryOne('SELECT id FROM users WHERE id = $1', [id]);
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  const name = sanitizeString(req.body.name);
  const email = sanitizeEmail(req.body.email);
  const role = req.body.role === 'admin' ? 'admin' : 'driver';
  const placa = sanitizeString(req.body.placa);
  const active = req.body.active === false ? 0 : 1;

  if (!name || !email) {
    res.status(400).json({ error: 'Nome e email são obrigatórios' });
    return;
  }

  const duplicate = await queryOne('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
  if (duplicate) {
    res.status(409).json({ error: 'Email já está em uso por outro usuário' });
    return;
  }

  if (req.body.password && typeof req.body.password === 'string' && req.body.password.length >= 6) {
    const hash = bcrypt.hashSync(req.body.password, 12);
    await runSql(
      'UPDATE users SET name=$1, email=$2, password_hash=$3, role=$4, placa=$5, active=$6 WHERE id=$7',
      [name, email, hash, role, placa, active, id]
    );
  } else {
    await runSql(
      'UPDATE users SET name=$1, email=$2, role=$3, placa=$4, active=$5 WHERE id=$6',
      [name, email, role, placa, active, id]
    );
  }

  res.json({ message: 'Usuário atualizado com sucesso' });
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  await runSql('UPDATE users SET active = 0 WHERE id = $1', [id]);
  res.json({ message: 'Usuário desativado com sucesso' });
});

export default router;
