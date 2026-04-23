import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarUI } from '../components/ui/calendar';
import { TrendingDown, TrendingUp, PiggyBank, X, ChevronLeft, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center px-5 animate-overlay-in">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 cursor-pointer bg-slate-900/40 border-0 p-0"
        onClick={onCancel}
      />
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-scale-in border border-slate-200/80"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-3 mb-3 animate-confirm-head">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={20} className="text-red-500 shrink-0 mt-px animate-modal-icon" aria-hidden />
              <h3 className="text-[1rem] font-bold text-slate-800">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-90 transition-all duration-150"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-[0.88rem] text-slate-500 leading-relaxed animate-confirm-text">{message}</p>
        </div>
        <div className="grid grid-cols-2 border-t border-slate-100 animate-confirm-actions">
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer py-4 text-[0.95rem] font-semibold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 hover:shadow-md active:scale-[0.98] transition-all duration-150 origin-center"
          >
            Sim
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer py-4 text-[0.95rem] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 hover:shadow-inner active:scale-[0.98] transition-all duration-150 border-l border-slate-200 origin-center"
          >
            Não
          </button>
        </div>
      </div>
    </div>
  );
}

type EntryType = 'recebido' | 'gasto' | 'guardado';

interface FinanceEntry {
  id: string;
  tipo: EntryType;
  data: string;
  descricao: string;
  valor: number;
}

interface FinanceSettings {
  month: string;
  goalType: 'percent' | 'value';
  goalPercent: string;
  goalValue: string;
}

const STORAGE_KEY  = 'finance_entries_v1';
const SETTINGS_KEY = 'finance_settings_v1';

const TYPE_CONFIG: Record<EntryType, { label: string; Icon: React.FC<{ size?: number }> }> = {
  recebido: { label: 'Recebido', Icon: ({ size }) => <TrendingUp  size={size} aria-hidden /> },
  gasto:    { label: 'Gasto',    Icon: ({ size }) => <TrendingDown size={size} aria-hidden /> },
  guardado: { label: 'Guardado', Icon: ({ size }) => <PiggyBank    size={size} aria-hidden /> },
};

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateDisplay(s: string): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function safeLoad(): FinanceEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown[];
    if (!Array.isArray(data)) return [];
    return data
      .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null && typeof (e as Record<string, unknown>).id === 'string')
      .map(e => {
        let tipo: EntryType = 'gasto';
        if (e.tipo === 'receita' || e.tipo === 'recebido') tipo = 'recebido';
        else if (e.tipo === 'guardar' || e.tipo === 'guardado') tipo = 'guardado';
        return { id: String(e.id), tipo, data: String(e.data ?? ''), descricao: String(e.descricao ?? ''), valor: typeof e.valor === 'number' ? e.valor : 0 };
      });
  } catch { return []; }
}

function safeSave(entries: FinanceEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function safeLoadSettings(): FinanceSettings {
  const fb: FinanceSettings = { month: currentMonthKey(), goalType: 'percent', goalPercent: '10', goalValue: '' };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fb;
    const d = JSON.parse(raw) as Partial<FinanceSettings>;
    return {
      month:       typeof d.month === 'string' && /^\d{4}-\d{2}$/.test(d.month) ? d.month : fb.month,
      goalType:    d.goalType === 'value' ? 'value' : 'percent',
      goalPercent: typeof d.goalPercent === 'string' ? d.goalPercent : fb.goalPercent,
      goalValue:   typeof d.goalValue  === 'string' ? d.goalValue  : fb.goalValue,
    };
  } catch { return fb; }
}

function safeSaveSettings(s: FinanceSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function DatePickerField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T12:00:00`) : undefined;

  function onDaySelect(date: Date | undefined) {
    if (!date) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.8rem] font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-[0.6rem] border rounded-lg text-[0.95rem] transition-colors text-left cursor-pointer
          ${!value ? 'text-slate-400' : 'text-slate-800'}
          ${open ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200 hover:border-blue-400'}`}
      >
        <Calendar size={16} className="text-slate-400 shrink-0" />
        <span className="flex-1">{value ? formatDateDisplay(value) : 'Selecionar data'}</span>
        <ChevronRight size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <CalendarUI
            mode="single"
            selected={selected}
            onSelect={onDaySelect}
          />
        </div>
      )}
    </div>
  );
}

function CurrencyInput({ cents, onChange }: { cents: number; onChange: (c: number) => void }) {
  const display = cents > 0
    ? (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';

  return (
    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10 transition-colors">
      <span className="px-3 py-[0.6rem] text-[0.9rem] font-bold text-slate-500 border-r border-slate-200 bg-slate-50 select-none shrink-0">
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        placeholder="0,00"
        className="flex-1 border-0 ring-0 focus:ring-0 focus:outline-none px-3 py-[0.6rem] text-[1.05rem] font-bold tabular-nums bg-transparent"
        onChange={e => {
          const digits = e.target.value.replace(/\D/g, '');
          onChange(digits ? parseInt(digits, 10) : 0);
        }}
      />
    </div>
  );
}

function MonthNav({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function shift(delta: number) {
    const [y, m] = value.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const [y, m] = value.split('-');
  const label = new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="flex items-center justify-center gap-3 mb-4 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
      <button type="button" onClick={() => shift(-1)}
        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 active:scale-90 transition-all duration-100">
        <ChevronLeft size={18} />
      </button>
      <span className="font-bold text-[1rem] min-w-[180px] text-center capitalize transition-all duration-200">{label}</span>
      <button type="button" onClick={() => shift(1)}
        className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-100 active:scale-90 transition-all duration-100">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

const TIPO_STYLE: Record<EntryType, { card: string; label: string; val: string; icon: string; badge: string; border: string }> = {
  recebido: {
    card: 'bg-green-50 border-green-200',
    label: 'text-green-700',
    val: 'text-green-600',
    icon: 'bg-green-100 text-green-700',
    badge: 'bg-green-100 text-green-800',
    border: 'border-l-green-500',
  },
  gasto: {
    card: 'bg-red-50 border-red-200',
    label: 'text-red-700',
    val: 'text-red-600',
    icon: 'bg-red-100 text-red-700',
    badge: 'bg-red-100 text-red-800',
    border: 'border-l-red-500',
  },
  guardado: {
    card: 'bg-blue-50 border-blue-200',
    label: 'text-blue-700',
    val: 'text-blue-600',
    icon: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    border: 'border-l-blue-500',
  },
};

export function Finance() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [tipo, setTipo] = useState<EntryType>('gasto');
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorCents, setValorCents] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [settings, setSettings] = useState<FinanceSettings>(() => safeLoadSettings());
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);
  const sheetPanelRef = useRef<HTMLDivElement>(null);
  const sheetScrollRef = useRef<HTMLDivElement>(null);
  const sheetDragStartY = useRef(0);
  const sheetDragYRef = useRef(0);
  const sheetScrollAtStart = useRef(0);

  useEffect(() => { setEntries(safeLoad()); }, []);
  useEffect(() => { safeSave(entries); }, [entries]);
  useEffect(() => { safeSaveSettings(settings); }, [settings]);

  useLayoutEffect(() => {
    if (!showForm) {
      setSheetDragY(0);
      setSheetDragging(false);
      sheetDragYRef.current = 0;
      return;
    }
    const panel = sheetPanelRef.current;
    if (!panel) return;

    const onStart = (e: TouchEvent) => {
      sheetDragStartY.current = e.touches[0].clientY;
      sheetScrollAtStart.current = sheetScrollRef.current?.scrollTop ?? 0;
      setSheetDragging(true);
    };

    const onMove = (e: TouchEvent) => {
      const scrollTop = sheetScrollRef.current?.scrollTop ?? 0;
      if (sheetScrollAtStart.current > 0 || scrollTop > 0) {
        if (sheetDragYRef.current > 0) {
          sheetDragYRef.current = 0;
          setSheetDragY(0);
        }
        return;
      }
      const dy = e.touches[0].clientY - sheetDragStartY.current;
      if (dy > 0) {
        e.preventDefault();
        const y = Math.min(dy, 280);
        sheetDragYRef.current = y;
        setSheetDragY(y);
      } else {
        sheetDragYRef.current = 0;
        setSheetDragY(0);
      }
    };

    const onEnd = () => {
      setSheetDragging(false);
      if (sheetDragYRef.current > 72) {
        resetForm();
        setShowForm(false);
      }
      sheetDragYRef.current = 0;
      setSheetDragY(0);
    };

    panel.addEventListener('touchstart', onStart, { passive: true });
    panel.addEventListener('touchmove', onMove, { passive: false });
    panel.addEventListener('touchend', onEnd);
    panel.addEventListener('touchcancel', onEnd);
    return () => {
      panel.removeEventListener('touchstart', onStart);
      panel.removeEventListener('touchmove', onMove);
      panel.removeEventListener('touchend', onEnd);
      panel.removeEventListener('touchcancel', onEnd);
    };
  }, [showForm]);

  const filteredEntries = useMemo(
    () => entries.filter(e => e.data.slice(0, 7) === settings.month),
    [entries, settings.month],
  );

  const totals = useMemo(() => {
    const recebido = filteredEntries.filter(e => e.tipo === 'recebido').reduce((s, e) => s + e.valor, 0);
    const gasto    = filteredEntries.filter(e => e.tipo === 'gasto').reduce((s, e) => s + e.valor, 0);
    const guardado = filteredEntries.filter(e => e.tipo === 'guardado').reduce((s, e) => s + e.valor, 0);
    return { recebido, gasto, guardado, disponivel: recebido - gasto };
  }, [filteredEntries]);

  const goal = useMemo(() => {
    const pct    = parseFloat(settings.goalPercent.replace(',', '.'));
    const byPct  = Number.isFinite(pct) && pct > 0 ? totals.recebido * (pct / 100) : 0;
    const byVal  = parseFloat(settings.goalValue.replace(',', '.')) || 0;
    const target = settings.goalType === 'value' ? byVal : byPct;
    const pctDone = target > 0 ? Math.min(100, (totals.guardado / target) * 100) : 0;
    return { target, falta: Math.max(0, target - totals.guardado), pctDone };
  }, [settings, totals]);

  function resetForm() {
    setTipo('gasto'); setData(''); setDescricao(''); setValorCents(0); setEditingId(null); setError('');
  }

  function openNew() { resetForm(); setShowForm(true); }

  function handleEdit(entry: FinanceEntry) {
    setTipo(entry.tipo);
    setData(entry.data);
    setDescricao(entry.descricao);
    setValorCents(Math.round(entry.valor * 100));
    setEditingId(entry.id);
    setError('');
    setShowForm(true);
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  function confirmDelete() {
    if (confirmDeleteId) setEntries(prev => prev.filter(e => e.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!data)             { setError('Selecione a data.');                    return; }
    if (!descricao.trim()) { setError('Informe a descrição.');                 return; }
    if (valorCents <= 0)   { setError('Informe um valor maior que R$ 0,00.'); return; }

    const entry: FinanceEntry = {
      id: editingId ?? `${Date.now()}`,
      tipo, data,
      descricao: descricao.trim(),
      valor: valorCents / 100,
    };

    setEntries(prev => editingId ? prev.map(e => e.id === editingId ? entry : e) : [entry, ...prev]);
    resetForm();
    setShowForm(false);
  }

  const monthBalance = totals.recebido - totals.gasto;

  return (
    <div className="pb-8 animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-[1.3rem] font-bold">Financeiro</h2>
          <p className="text-[0.9rem] text-slate-500 mt-0.5">{user?.name}</p>
        </div>
        <button className="btn btn-primary shadow-md" onClick={openNew}>+ Lançamento</button>
      </div>

      <MonthNav value={settings.month} onChange={v => setSettings(s => ({ ...s, month: v }))} />

      {/* Summary cards — 2×2 mobile, 4×1 desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 stagger">
        {(['recebido', 'gasto', 'guardado'] as EntryType[]).map(t => {
          const s = TIPO_STYLE[t];
          const val = totals[t as keyof typeof totals] as number;
          const { Icon } = TYPE_CONFIG[t];
          return (
            <div key={t} className={`rounded-xl p-3.5 border shadow-sm card-lift animate-fade-in-up ${s.card}`}>
              <div className={`flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-wide mb-1 ${s.label}`}>
                <Icon size={14} /> {TYPE_CONFIG[t].label}
              </div>
              <div className={`text-[1.05rem] font-extrabold tabular-nums ${s.val}`}>{formatBRL(val)}</div>
            </div>
          );
        })}
        <div className={`rounded-xl p-3.5 border shadow-sm card-lift animate-fade-in-up ${totals.disponivel < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className={`text-[0.72rem] font-bold uppercase tracking-wide mb-1 ${totals.disponivel < 0 ? 'text-red-700' : 'text-slate-500'}`}>
            Disponível
          </div>
          <div className={`text-[1.05rem] font-extrabold tabular-nums ${totals.disponivel < 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {formatBRL(totals.disponivel)}
          </div>
        </div>
      </div>

      {/* Goal bar */}
      {goal.target > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.78rem] font-bold uppercase tracking-wide text-slate-500">Meta para guardar</span>
            <span className="font-bold text-[0.95rem]">{formatBRL(goal.target)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${goal.pctDone}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            {goal.falta > 0
              ? <span className="text-[0.78rem] text-slate-500">Falta {formatBRL(goal.falta)}</span>
              : <span className="text-[0.78rem] text-green-600 font-bold">Meta atingida! 🎉</span>}
            <span className="text-[0.78rem] font-bold text-blue-600">{goal.pctDone.toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* List header */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-[0.82rem] text-slate-500 flex-1">
          {filteredEntries.length} lançamento{filteredEntries.length !== 1 ? 's' : ''}
        </span>
        {monthBalance !== 0 && (
          <span className={`text-[0.85rem] font-bold ${monthBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Saldo: {formatBRL(monthBalance)}
          </span>
        )}
        <button className="btn btn-sm btn-outline" onClick={() => setShowGoal(v => !v)}>
          {showGoal ? 'Fechar meta' : 'Configurar meta'}
        </button>
      </div>

      {/* Goal settings */}
      {showGoal && (
        <div className="record-form mb-4">
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de meta</label>
              <select value={settings.goalType} onChange={e => setSettings(s => ({ ...s, goalType: e.target.value as 'percent' | 'value' }))}>
                <option value="percent">% do que recebeu</option>
                <option value="value">Valor fixo</option>
              </select>
            </div>
            {settings.goalType === 'percent' ? (
              <div className="form-group">
                <label>Percentual (%)</label>
                <input value={settings.goalPercent} onChange={e => setSettings(s => ({ ...s, goalPercent: e.target.value }))} inputMode="decimal" placeholder="10" />
              </div>
            ) : (
              <div className="form-group">
                <label>Valor meta (R$)</label>
                <input value={settings.goalValue} onChange={e => setSettings(s => ({ ...s, goalValue: e.target.value }))} inputMode="decimal" placeholder="0,00" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entry list */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-500 animate-fade-in-up">
          <PiggyBank size={44} className="text-slate-300" />
          <p className="text-[0.95rem]">Nenhum lançamento neste mês</p>
          <button className="btn btn-primary" onClick={openNew}>Adicionar primeiro lançamento</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 stagger">
          {filteredEntries.map(e => {
            const s = TIPO_STYLE[e.tipo];
            const { Icon } = TYPE_CONFIG[e.tipo];
            return (
              <div key={e.id} className={`entry-card animate-fade-in-up flex items-center gap-3 bg-white border border-l-4 ${s.border} border-slate-200 rounded-xl p-3.5 shadow-sm`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${s.icon}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9rem] font-semibold text-slate-800 truncate">{e.descricao}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`text-[0.68rem] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${s.badge}`}>
                      {TYPE_CONFIG[e.tipo].label}
                    </span>
                    <span className="text-[0.75rem] text-slate-500">{formatDateDisplay(e.data)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[0.95rem] font-extrabold tabular-nums ${s.val}`}>
                    {e.tipo === 'gasto' ? '−' : '+'} {formatBRL(e.valor)}
                  </span>
                  <div className="flex gap-1">
                    <button className="btn btn-sm btn-outline" onClick={() => handleEdit(e)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.id)}>Excluir</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom-sheet form */}
      {showForm && (
        <div
          className="fixed inset-0 bg-slate-900/45 z-300 flex items-end sm:items-center sm:justify-center animate-overlay-in"
          onMouseDown={e => { if (e.target === e.currentTarget) { resetForm(); setShowForm(false); } }}
        >
          <div
            ref={sheetPanelRef}
            className="bg-white w-full max-h-[92dvh] overflow-hidden rounded-t-2xl sm:w-[440px] sm:rounded-2xl sm:max-h-[88dvh] flex flex-col shadow-2xl animate-slide-up sm:animate-scale-in"
            style={{
              transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : undefined,
              transition: sheetDragging ? 'none' : 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            <div className="shrink-0 px-5 pt-3 select-none sm:pt-4">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[1.1rem] font-bold">{editingId ? 'Editar lançamento' : 'Novo lançamento'}</h3>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div ref={sheetScrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 pb-8 touch-pan-y">
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Tipo tabs */}
              <div className="flex flex-col gap-1">
                <label className="text-[0.8rem] font-semibold text-slate-500 uppercase tracking-wide">O que é?</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['recebido', 'gasto', 'guardado'] as EntryType[]).map(t => {
                    const s = TIPO_STYLE[t];
                    const { Icon } = TYPE_CONFIG[t];
                    const active = tipo === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTipo(t)}
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 font-bold text-[0.8rem] cursor-pointer
                          transition-all duration-150 active:scale-95
                          ${active
                            ? `${s.card} ${s.label} border-current shadow-sm scale-[1.03]`
                            : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:border-slate-300'}`}
                      >
                        <Icon size={18} />
                        {TYPE_CONFIG[t].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valor */}
              <div className="flex flex-col gap-1">
                <label className="text-[0.8rem] font-semibold text-slate-500 uppercase tracking-wide">Valor</label>
                <CurrencyInput cents={valorCents} onChange={setValorCents} />
              </div>

              <DatePickerField value={data} onChange={setData} label="Data" />

              {/* Descrição */}
              <div className="flex flex-col gap-1">
                <label className="text-[0.8rem] font-semibold text-slate-500 uppercase tracking-wide">Descrição</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Ex.: Salário, Diesel, Reserva de emergência…"
                  maxLength={100}
                  autoComplete="off"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`btn btn-full text-[1rem] py-3 mt-1 text-white
                  ${tipo === 'recebido' ? 'bg-green-600 hover:bg-green-700'
                  : tipo === 'gasto'    ? 'bg-red-600   hover:bg-red-700'
                  :                       'bg-blue-600  hover:bg-blue-700'}`}
              >
                {editingId ? 'Salvar alterações' : `Adicionar ${TYPE_CONFIG[tipo].label.toLowerCase()}`}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline btn-full" onClick={() => { resetForm(); setShowForm(false); }}>
                  Cancelar
                </button>
              )}
            </form>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          title="Excluir lançamento?"
          message="Esta ação não poderá ser revertida e o lançamento será removido permanentemente."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
