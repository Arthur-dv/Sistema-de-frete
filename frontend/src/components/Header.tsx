import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate('/login');
    setOpen(false);
  }

  const links = [
    { to: '/',                label: 'Viagens' },
    { to: '/abastecimentos',  label: 'Abastecimentos' },
    { to: '/financeiro',      label: 'Financeiro' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  function navClass(to: string, mobile = false) {
    const active = location.pathname === to;
    const base = mobile
      ? 'flex items-center px-4 py-3.5 rounded-xl text-[0.95rem] font-medium transition-colors'
      : 'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors';
    return active
      ? `${base} bg-blue-50 text-blue-600`
      : `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-100 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center gap-3 h-14">

          {/* Logo */}
          <Link to="/" className="font-bold text-[1.05rem] text-blue-600 shrink-0 mr-2">
            Sistema de Fretes
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} className={navClass(l.to)}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop: user + logout */}
          <div className="hidden sm:flex ml-auto items-center gap-3">
            <span className="text-sm text-slate-500 max-w-[160px] truncate">{user.name}</span>
            <button onClick={handleLogout} className="btn btn-sm btn-outline gap-1.5">
              <LogOut size={14} /> Sair
            </button>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="sm:hidden ml-auto flex items-center justify-center w-11 h-11 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-99 flex flex-col animate-fade-in" style={{ top: '3.5rem' }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="relative bg-white w-full border-b border-slate-200 px-4 py-3 flex flex-col gap-1 shadow-xl animate-fade-in-up">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={navClass(l.to, true)}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}

            <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500 truncate max-w-[200px]">{user.name}</span>
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline gap-1.5"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
