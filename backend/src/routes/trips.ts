import { Router, Request, Response } from 'express';
import { queryAll, queryOne, runSql, getLastInsertId } from '../database';
import { authenticate } from '../middleware/auth';
import { sanitizeString, sanitizeNumber, sanitizeDateString } from '../utils/sanitize';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const trips = queryAll(
    'SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  res.json({ trips });
});

router.post('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const placa = sanitizeString(req.body.placa);
  const data = sanitizeDateString(req.body.data);
  const cte_rodeiro = sanitizeString(req.body.cte_rodeiro);
  const empresa_origem = sanitizeString(req.body.empresa_origem);
  const empresa_destino = sanitizeString(req.body.empresa_destino);
  const vr_frete_peso = sanitizeNumber(req.body.vr_frete_peso);
  const data_recbto = sanitizeDateString(req.body.data_recbto);
  const recebido_por = sanitizeString(req.body.recebido_por);

  if (!placa || !data) {
    res.status(400).json({ error: 'Placa e data são obrigatórios' });
    return;
  }

  runSql(
    `INSERT INTO trips (user_id, placa, data, cte_rodeiro, empresa_origem, empresa_destino, vr_frete_peso, data_recbto, recebido_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, placa, data, cte_rodeiro, empresa_origem, empresa_destino, vr_frete_peso, data_recbto, recebido_por]
  );

  const id = getLastInsertId();
  const trip = queryOne('SELECT * FROM trips WHERE id = ?', [id]);
  res.status(201).json({ trip });
});

router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM trips WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }

  const placa = sanitizeString(req.body.placa);
  const data = sanitizeDateString(req.body.data);
  const cte_rodeiro = sanitizeString(req.body.cte_rodeiro);
  const empresa_origem = sanitizeString(req.body.empresa_origem);
  const empresa_destino = sanitizeString(req.body.empresa_destino);
  const vr_frete_peso = sanitizeNumber(req.body.vr_frete_peso);
  const data_recbto = sanitizeDateString(req.body.data_recbto);
  const recebido_por = sanitizeString(req.body.recebido_por);

  runSql(
    `UPDATE trips SET placa=?, data=?, cte_rodeiro=?, empresa_origem=?, empresa_destino=?, vr_frete_peso=?, data_recbto=?, recebido_por=?
     WHERE id=? AND user_id=?`,
    [placa, data, cte_rodeiro, empresa_origem, empresa_destino, vr_frete_peso, data_recbto, recebido_por, id, userId]
  );

  const trip = queryOne('SELECT * FROM trips WHERE id = ?', [id]);
  res.json({ trip });
});

router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM trips WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }

  runSql('DELETE FROM trips WHERE id = ? AND user_id = ?', [id, userId]);
  res.json({ message: 'Viagem removida com sucesso' });
});

router.get('/totals', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const row = queryOne(
    'SELECT COALESCE(SUM(vr_frete_peso), 0) as total_frete FROM trips WHERE user_id = ?',
    [userId]
  );
  res.json({ total_frete: row?.total_frete ?? 0 });
});

export default router;
