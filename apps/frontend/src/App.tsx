import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { ProfesorDashboard } from '@/pages/ProfesorDashboard';

export function App() {
  const { hydrate, usuario } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profesor/*"
          element={
            <ProtectedRoute allowedRoles={['PROFESOR']}>
              <ProfesorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root redirect based on auth state */}
        <Route
          path="/"
          element={
            usuario
              ? <Navigate to={usuario.rol === 'ADMIN' ? '/admin' : '/profesor'} replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
