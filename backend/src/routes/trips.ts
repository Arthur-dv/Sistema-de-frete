import { Router, Request, Response } from 'express';
import { queryAll, queryOne, runSql } from '../database';
import { authenticate } from '../middleware/auth';
import { sanitizeString, sanitizeNumber, sanitizeDateString } from '../utils/sanitize';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const trips = await queryAll(
    'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  res.json({ trips });
});

router.post('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const placa = sanitizeString(req.body.placa);
  const data = sanitizeDateString(req.body.data);
  const cte_rodeiro = sanitizeString(req.body.cte_rodeiro);
  const empresa_origem = sanitizeString(req.body.empresa_origem);
  const empresa_destino = sanitizeString(req.body.empresa_destino);
  const vr_frete_peso = sanitizeNumber(req.body.vr_frete_peso);
  const data_recbto = sanitizeDateString(req.body.data_recbto) || null;
  const recebido_por = sanitizeString(req.body.recebido_por);

  if (!placa || !data) {
    res.status(400).json({ error: 'Placa e data são obrigatórios' });
    return;
  }

  const trip = await queryOne(
    `INSERT INTO trips (user_id, placa, data, cte_rodeiro, empresa_origem, empresa_destino, vr_frete_peso, data_recbto, recebido_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [userId, placa, data, cte_rodeiro, empresa_origem, empresa_destino, vr_frete_peso, data_recbto, recebido_por]
  );
  res.status(201).json({ trip });
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = parseInt(String(req.params.id), 10);

  const existing = await queryOne('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [id, userId]);
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
  const data_recbto = sanitizeDateString(req.body.data_recbto) || null;
  const recebido_por = sanitizeString(req.body.recebido_por);

  const trip = await queryOne(
    `UPDATE trips SET placa=$1, data=$2, cte_rodeiro=$3, empresa_origem=$4, empresa_destino=$5,
     vr_frete_peso=$6, data_recbto=$7, recebido_por=$8
     WHERE id=$9 AND user_id=$10 RETURNING *`,
    [placa, data, cte_rodeiro, empresa_origem, empresa_destino, vr_frete_peso, data_recbto, recebido_por, id, userId]
  );
  res.json({ trip });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = parseInt(String(req.params.id), 10);

  const existing = await queryOne('SELECT id FROM trips WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!existing) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }

  await runSql('DELETE FROM trips WHERE id = $1 AND user_id = $2', [id, userId]);
  res.json({ message: 'Viagem removida com sucesso' });
});

router.get('/totals', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const row = await queryOne(
    'SELECT COALESCE(SUM(vr_frete_peso), 0) as total_frete FROM trips WHERE user_id = $1',
    [userId]
  );
  res.json({ total_frete: row?.total_frete ?? 0 });
});

export default router;
