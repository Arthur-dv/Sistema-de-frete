import { Router, Request, Response } from 'express';
import { queryAll, queryOne, runSql, getLastInsertId } from '../database';
import { authenticate } from '../middleware/auth';
import { sanitizeString, sanitizeNumber, sanitizeDateString } from '../utils/sanitize';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const records = queryAll(
    'SELECT * FROM fuel_records WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  res.json({ records });
});

router.post('/', (req: Request, res: Response) => {
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

  runSql(
    `INSERT INTO fuel_records (user_id, placa, data, nome_posto, km, litros, valor_abastecido, recebido_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, placa, data, nome_posto, km, litros, valor_abastecido, recebido_por]
  );

  const id = getLastInsertId();
  const record = queryOne('SELECT * FROM fuel_records WHERE id = ?', [id]);
  res.status(201).json({ record });
});

router.put('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM fuel_records WHERE id = ? AND user_id = ?', [id, userId]);
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

  runSql(
    `UPDATE fuel_records SET placa=?, data=?, nome_posto=?, km=?, litros=?, valor_abastecido=?, recebido_por=?
     WHERE id=? AND user_id=?`,
    [placa, data, nome_posto, km, litros, valor_abastecido, recebido_por, id, userId]
  );

  const record = queryOne('SELECT * FROM fuel_records WHERE id = ?', [id]);
  res.json({ record });
});

router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = parseInt(req.params.id, 10);

  const existing = queryOne('SELECT id FROM fuel_records WHERE id = ? AND user_id = ?', [id, userId]);
  if (!existing) {
    res.status(404).json({ error: 'Registro não encontrado' });
    return;
  }

  runSql('DELETE FROM fuel_records WHERE id = ? AND user_id = ?', [id, userId]);
  res.json({ message: 'Registro removido com sucesso' });
});

router.get('/totals', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const row = queryOne(
    'SELECT COALESCE(SUM(litros), 0) as total_litros, COALESCE(SUM(valor_abastecido), 0) as total_valor FROM fuel_records WHERE user_id = ?',
    [userId]
  );
  res.json({ total_litros: row?.total_litros ?? 0, total_valor: row?.total_valor ?? 0 });
});

export default router;
