import { Router, Request, Response } from 'express';
import { queryAll, queryOne, runSql } from '../database';
import { authenticate } from '../middleware/auth';
import { sanitizeString, sanitizeNumber, sanitizeDateString } from '../utils/sanitize';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const records = await queryAll(
    'SELECT * FROM fuel_records WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  res.json({ records });
});

router.post('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const placa = sanitizeString(req.body.placa);
  const data = sanitizeDateString(req.body.data);
  const nome_posto = sanitizeString(req.body.nome_posto);
  const km = sanitizeNumber(req.body.km);
  const litros = sanitizeNumber(req.body.litros);
  const valor_abastecido = sanitizeNumber(req.body.valor_abastecido);
  const recebido_por = sanitizeString(req.body.recebido_por);

  if (!placa || !data) {
    res.status(400).json({ error: 'Placa e data são obrigatórios' });
    return;
  }

  const record = await queryOne(
    `INSERT INTO fuel_records (user_id, placa, data, nome_posto, km, litros, valor_abastecido, recebido_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, placa, data, nome_posto, km, litros, valor_abastecido, recebido_por]
  );
  res.status(201).json({ record });
});

router.put('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = parseInt(String(req.params.id), 10);

  const existing = await queryOne('SELECT id FROM fuel_records WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!existing) {
    res.status(404).json({ error: 'Registro não encontrado' });
    return;
  }

  const placa = sanitizeString(req.body.placa);
  const data = sanitizeDateString(req.body.data);
  const nome_posto = sanitizeString(req.body.nome_posto);
  const km = sanitizeNumber(req.body.km);
  const litros = sanitizeNumber(req.body.litros);
  const valor_abastecido = sanitizeNumber(req.body.valor_abastecido);
  const recebido_por = sanitizeString(req.body.recebido_por);

  const record = await queryOne(
    `UPDATE fuel_records SET placa=$1, data=$2, nome_posto=$3, km=$4, litros=$5, valor_abastecido=$6, recebido_por=$7
     WHERE id=$8 AND user_id=$9 RETURNING *`,
    [placa, data, nome_posto, km, litros, valor_abastecido, recebido_por, id, userId]
  );
  res.json({ record });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = parseInt(String(req.params.id), 10);

  const existing = await queryOne('SELECT id FROM fuel_records WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!existing) {
    res.status(404).json({ error: 'Registro não encontrado' });
    return;
  }

  await runSql('DELETE FROM fuel_records WHERE id = $1 AND user_id = $2', [id, userId]);
  res.json({ message: 'Registro removido com sucesso' });
});

router.get('/totals', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const row = await queryOne(
    'SELECT COALESCE(SUM(litros), 0) as total_litros, COALESCE(SUM(valor_abastecido), 0) as total_valor FROM fuel_records WHERE user_id = $1',
    [userId]
  );
  res.json({ total_litros: row?.total_litros ?? 0, total_valor: row?.total_valor ?? 0 });
});

export default router;
