import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface FuelRecord {
  id: number;
  placa: string;
  data: string;
  nome_posto: string;
  km: number;
  litros: number;
  valor_abastecido: number;
  recebido_por: string;
}

const emptyRecord = {
  placa: '',
  data: '',
  nome_posto: '',
  km: '',
  litros: '',
  valor_abastecido: '',
  recebido_por: '',
};

export function Fuel() {
  const { user } = useAuth();
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [form, setForm] = useState(emptyRecord);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const totalLitros = records.reduce((sum, r) => sum + (r.litros || 0), 0);
  const totalValor  = records.reduce((sum, r) => sum + (r.valor_abastecido || 0), 0);

  useEffect(() => { loadRecords(); }, []);

  useEffect(() => {
    if (user?.placa && !editingId) {
      setForm(f => ({ ...f, placa: f.placa || user.placa }));
    }
  }, [user, editingId]);

  async function loadRecords() {
    try {
      const data = await api.get<{ records: FuelRecord[] }>('/fuel');
      setRecords(data.records);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      km: parseFloat(form.km.replace(',', '.')) || 0,
      litros: parseFloat(form.litros.replace(',', '.')) || 0,
      valor_abastecido: parseFloat(form.valor_abastecido.replace(',', '.')) || 0,
    };
    try {
      if (editingId) {
        await api.put(`/fuel/${editingId}`, payload);
        setEditingId(null);
      } else {
        await api.post('/fuel', payload);
      }
      setForm({ ...emptyRecord, placa: user?.placa || '' });
      await loadRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  function handleEdit(record: FuelRecord) {
    setEditingId(record.id);
    setForm({
      placa: record.placa,
      data: record.data,
      nome_posto: record.nome_posto,
      km: record.km.toString(),
      litros: record.litros.toString(),
      valor_abastecido: record.valor_abastecido.toString(),
      recebido_por: record.recebido_por,
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja remover este registro?')) return;
    try {
      await api.delete(`/fuel/${id}`);
      await loadRecords();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm({ ...emptyRecord, placa: user?.placa || '' });
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Relação dos Abastecimentos</h2>
        <p className="motorista">Motorista: <strong>{user?.name}</strong></p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="record-form">
        <div className="form-row">
          <div className="form-group">
            <label>Placa</label>
            <input value={form.placa} onChange={e => handleChange('placa', e.target.value)} required placeholder="ABC-1234" />
          </div>
          <div className="form-group">
            <label>Data</label>
            <input type="date" value={form.data} onChange={e => handleChange('data', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Nome do Posto</label>
            <input value={form.nome_posto} onChange={e => handleChange('nome_posto', e.target.value)} placeholder="Nome do posto" />
          </div>
          <div className="form-group">
            <label>KM</label>
            <input value={form.km} onChange={e => handleChange('km', e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Litros</label>
            <input value={form.litros} onChange={e => handleChange('litros', e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
          <div className="form-group">
            <label>Valor Abastecido (R$)</label>
            <input value={form.valor_abastecido} onChange={e => handleChange('valor_abastecido', e.target.value)} placeholder="0,00" inputMode="decimal" />
          </div>
          <div className="form-group">
            <label>Recebido Por</label>
            <input value={form.recebido_por} onChange={e => handleChange('recebido_por', e.target.value)} placeholder="Nome" />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-full sm:w-auto">{editingId ? 'Atualizar Abastecimento' : 'Adicionar Abastecimento'}</button>
          {editingId && <button type="button" className="btn btn-outline btn-full sm:w-auto" onClick={handleCancel}>Cancelar</button>}
        </div>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Ações</th>
              <th>Placa</th>
              <th>Data</th>
              <th>Nome do Posto</th>
              <th>KM</th>
              <th>Litros</th>
              <th>Valor Abastecido</th>
              <th>Recebido Por</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={8} className="empty">Nenhum abastecimento registrado</td></tr>
            ) : (
              records.map(record => (
                <tr key={record.id}>
                  <td className="actions">
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(record)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(record.id)}>Excluir</button>
                  </td>
                  <td>{record.placa}</td>
                  <td>{record.data}</td>
                  <td>{record.nome_posto}</td>
                  <td className="number">{record.km}</td>
                  <td className="number">{record.litros}</td>
                  <td className="number">{record.valor_abastecido}</td>
                  <td>{record.recebido_por || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="total-label">TOTAL</td>
              <td className="total-value">{totalLitros} L</td>
              <td className="total-value">{totalValor}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
