import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { LoginPage } from '@/pages/LoginPage';
import { AlumnosPage } from '@/pages/admin/AlumnosPage';
import { ClasesPagosPage } from '@/pages/admin/ClasesPagosPage';
import { ConfigPage } from '@/pages/admin/ConfigPage';
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

        {/* Admin routes with sidebar layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="alumnos" replace />} />
          <Route path="alumnos" element={<AlumnosPage />} />
          <Route path="clases-pagos" element={<ClasesPagosPage />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>

        <Route
          path="/profesor/*"
          element={
            <ProtectedRoute allowedRoles={['PROFESOR']}>
              <ProfesorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            usuario
              ? <Navigate to={usuario.rol === 'ADMIN' ? '/admin' : '/profesor'} replace />
              : <Navigate to="/login" replace />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
