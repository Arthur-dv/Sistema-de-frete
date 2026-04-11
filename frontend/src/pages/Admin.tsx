import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  placa: string;
  active: number;
  created_at: string;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'driver',
  placa: '',
};

export function Admin() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await api.get<{ users: UserRecord[] }>('/admin/users');
      setUsers(data.users);
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
    setSuccess('');
    try {
      if (editingId) {
        const payload: Record<string, unknown> = { ...form };
        if (!form.password) delete payload.password;
        await api.put(`/admin/users/${editingId}`, payload);
        setSuccess('Usuário atualizado com sucesso');
        setEditingId(null);
      } else {
        await api.post('/admin/users', form);
        setSuccess('Usuário criado com sucesso');
      }
      setForm(emptyForm);
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleEdit(user: UserRecord) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      placa: user.placa,
    });
    setError('');
    setSuccess('');
  }

  async function handleToggleActive(user: UserRecord) {
    try {
      await api.put(`/admin/users/${user.id}`, {
        name: user.name,
        email: user.email,
        role: user.role,
        placa: user.placa,
        active: !user.active,
      });
      await loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setSuccess('');
  }

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Gerenciar Usuários</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="record-form">
        <h3>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Nome</label>
            <input value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="Nome completo" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} required placeholder="email@exemplo.com" />
          </div>
          <div className="form-group">
            <label>Senha {editingId ? '(deixe vazio para manter)' : ''}</label>
            <input type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} required={!editingId} placeholder="Min. 6 caracteres" autoComplete="new-password" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Perfil</label>
            <select value={form.role} onChange={e => handleChange('role', e.target.value)}>
              <option value="driver">Motorista</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="form-group">
            <label>Placa Vinculada</label>
            <input value={form.placa} onChange={e => handleChange('placa', e.target.value)} placeholder="ABC-1234" />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Atualizar' : 'Cadastrar'}
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
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Placa</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={!u.active ? 'inactive-row' : ''}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role === 'admin' ? 'Admin' : 'Motorista'}</td>
                <td>{u.placa || '-'}</td>
                <td>
                  <span className={`badge ${u.active ? 'badge-active' : 'badge-inactive'}`}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="actions">
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(u)}>Editar</button>
                  <button className="btn btn-sm btn-outline" onClick={() => handleToggleActive(u)}>
                    {u.active ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
