import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="header-title">Sistema de Fretes</Link>
      </div>
      <nav className="header-nav">
        <Link to="/">Viagens</Link>
        <Link to="/abastecimentos">Abastecimentos</Link>
        {isAdmin && <Link to="/admin">Admin</Link>}
      </nav>
      <div className="header-right">
        <span className="header-user">{user.name}</span>
        <button onClick={handleLogout} className="btn btn-sm btn-outline">Sair</button>
      </div>
    </header>
  );
}
