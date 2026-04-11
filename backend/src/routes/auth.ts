import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne } from '../database';
import { generateToken, authenticate } from '../middleware/auth';
import { sanitizeEmail } from '../utils/sanitize';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const email = sanitizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  const user = queryOne(
    'SELECT id, name, email, password_hash, role, placa, active FROM users WHERE email = ?',
    [email]
  );

  if (!user || !user.active) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const token = generateToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      placa: user.placa,
    },
  });
});

router.get('/me', authenticate, (req: Request, res: Response) => {
  const user = queryOne(
    'SELECT id, name, email, role, placa FROM users WHERE id = ? AND active = 1',
    [req.user!.userId]
  );

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  res.json({ user });
});

export default router;
