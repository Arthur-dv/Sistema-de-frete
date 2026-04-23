import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Trips } from './pages/Trips';
import { Fuel } from './pages/Fuel';
import { Admin } from './pages/Admin';
import { Finance } from './pages/Finance';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <main className="max-w-[1200px] mx-auto px-4 py-4 sm:px-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
            <Route path="/abastecimentos" element={<ProtectedRoute><Fuel /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
