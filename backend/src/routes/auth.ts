import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne } from '../database';
import { generateToken, authenticate } from '../middleware/auth';
import { sanitizeEmail } from '../utils/sanitize';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = sanitizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' });
      return;
    }

    const user = await queryOne(
      'SELECT id, name, email, password_hash, role, placa, active FROM users WHERE email = $1',
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await queryOne(
      'SELECT id, name, email, role, placa FROM users WHERE id = $1 AND active = 1',
      [req.user!.userId]
    );

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar usuário' });
  }
});

export default router;
