import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, runSql, getLastInsertId } from '../database';
import { authenticate, requireAdmin } from '../middleware/auth';
import { sanitizeString, sanitizeEmail } from '../utils/sanitize';

function idFromParams(idParam: string | string[] | undefined): number {
  const s = Array.isArray(idParam) ? idParam[0] : idParam;
  if (s == null || s === '') return NaN;
  return parseInt(String(s), 10);
}

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', (_req: Request, res: Response) => {
  const users = queryAll(
    'SELECT id, name, email, role, placa, active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ users });
});

router.post('/users', (req: Request, res: Response) => {
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

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    res.status(409).json({ error: 'Email já cadastrado' });
    return;
  }

  const hash = bcrypt.hashSync(password, 12);

  runSql(
    'INSERT INTO users (name, email, password_hash, role, placa) VALUES (?, ?, ?, ?, ?)',
    [name, email, hash, role, placa]
  );
  const id = getLastInsertId();

  res.status(201).json({
    user: { id, name, email, role, placa, active: 1 },
  });
});

router.put('/users/:id', (req: Request, res: Response) => {
  const id = idFromParams(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  const user = queryOne('SELECT id FROM users WHERE id = ?', [id]);
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

  const duplicate = queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
  if (duplicate) {
    res.status(409).json({ error: 'Email já está em uso por outro usuário' });
    return;
  }

  if (req.body.password && typeof req.body.password === 'string' && req.body.password.length >= 6) {
    const hash = bcrypt.hashSync(req.body.password, 12);
    runSql(
      'UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, placa = ?, active = ? WHERE id = ?',
      [name, email, hash, role, placa, active, id]
    );
  } else {
    runSql(
      'UPDATE users SET name = ?, email = ?, role = ?, placa = ?, active = ? WHERE id = ?',
      [name, email, role, placa, active, id]
    );
  }

  res.json({ message: 'Usuário atualizado com sucesso' });
});

router.delete('/users/:id', (req: Request, res: Response) => {
  const id = idFromParams(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: 'ID inválido' });
    return;
  }

  runSql('UPDATE users SET active = 0 WHERE id = ?', [id]);
  res.json({ message: 'Usuário desativado com sucesso' });
});

export default router;
