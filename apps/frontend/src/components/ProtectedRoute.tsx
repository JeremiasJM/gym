import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'PROFESOR')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { token, usuario } = useAuthStore();

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(usuario.rol)) {
    // Redirigir a su ruta correspondiente si no tiene permiso
    const fallback = usuario.rol === 'ADMIN' ? '/admin' : '/profesor';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
