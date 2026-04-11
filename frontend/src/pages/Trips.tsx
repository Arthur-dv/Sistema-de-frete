import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Trip {
  id: number;
  placa: string;
  data: string;
  cte_rodeiro: string;
  empresa_origem: string;
  empresa_destino: string;
  vr_frete_peso: number;
  data_recbto: string;
  recebido_por: string;
}

const emptyTrip = {
  placa: '',
  data: '',
  cte_rodeiro: '',
  empresa_origem: '',
  empresa_destino: '',
  vr_frete_peso: '',
  data_recbto: '',
  recebido_por: '',
};

export function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [form, setForm] = useState(emptyTrip);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const totalFrete = trips.reduce((sum, t) => sum + (t.vr_frete_peso || 0), 0);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (user?.placa && !editingId) {
      setForm(f => ({ ...f, placa: f.placa || user.placa }));
    }
  }, [user, editingId]);

  async function loadTrips() {
    try {
      const data = await api.get<{ trips: Trip[] }>('/trips');
      setTrips(data.trips);
    } catch (err: any) {
      setError(err.message);
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
      vr_frete_peso: parseFloat(form.vr_frete_peso.replace(',', '.')) || 0,
    };
    try {
      if (editingId) {
        await api.put(`/trips/${editingId}`, payload);
        setEditingId(null);
      } else {
        await api.post('/trips', payload);
      }
      setForm({ ...emptyTrip, placa: user?.placa || '' });
      await loadTrips();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleEdit(trip: Trip) {
    setEditingId(trip.id);
    setForm({
      placa: trip.placa,
      data: trip.data,
      cte_rodeiro: trip.cte_rodeiro,
      empresa_origem: trip.empresa_origem,
      empresa_destino: trip.empresa_destino,
      vr_frete_peso: trip.vr_frete_peso.toString(),
      data_recbto: trip.data_recbto || '',
      recebido_por: trip.recebido_por,
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja remover esta viagem?')) return;
    try {
      await api.delete(`/trips/${id}`);
      await loadTrips();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm({ ...emptyTrip, placa: user?.placa || '' });
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Relação das Viagens</h2>
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
            <label>CTe Rodeiro</label>
            <input value={form.cte_rodeiro} onChange={e => handleChange('cte_rodeiro', e.target.value)} placeholder="Número CTe" />
          </div>
          <div className="form-group">
            <label>Empresa Origem</label>
            <input value={form.empresa_origem} onChange={e => handleChange('empresa_origem', e.target.value)} placeholder="Origem" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Empresa Destino</label>
            <input value={form.empresa_destino} onChange={e => handleChange('empresa_destino', e.target.value)} placeholder="Destino" />
          </div>
          <div className="form-group">
            <label>VR Frete Peso (R$)</label>
            <input value={form.vr_frete_peso} onChange={e => handleChange('vr_frete_peso', e.target.value)} placeholder="0,00" inputMode="decimal" />
          </div>
          <div className="form-group">
            <label>Data Recebimento</label>
            <input type="date" value={form.data_recbto} onChange={e => handleChange('data_recbto', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Recebido Por</label>
            <input value={form.recebido_por} onChange={e => handleChange('recebido_por', e.target.value)} placeholder="Nome" />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Atualizar' : 'Adicionar'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={handleCancel}>Cancelar</button>
          )}
        </div>
      </form>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Data</th>
              <th>CTe Rodeiro</th>
              <th>Empresa Origem</th>
              <th>Empresa Destino</th>
              <th>VR Frete Peso</th>
              <th>Data Recbto</th>
              <th>Recebido Por</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr><td colSpan={9} className="empty">Nenhuma viagem registrada</td></tr>
            ) : (
              trips.map(trip => (
                <tr key={trip.id}>
                  <td>{trip.placa}</td>
                  <td>{trip.data}</td>
                  <td>{trip.cte_rodeiro}</td>
                  <td>{trip.empresa_origem}</td>
                  <td>{trip.empresa_destino}</td>
                  <td className="number">R$ {trip.vr_frete_peso.toFixed(2)}</td>
                  <td>{trip.data_recbto || '-'}</td>
                  <td>{trip.recebido_por || '-'}</td>
                  <td className="actions">
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(trip)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(trip.id)}>Excluir</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="total-label">TOTAL FRETE PESO</td>
              <td className="number total-value">R$ {totalFrete.toFixed(2)}</td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
