import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between border-b border-cefide-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cefide-accent">CEFIDE</h1>
          <p className="text-sm text-cefide-muted">Panel de Administración</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-cefide-muted">{usuario?.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Salir
          </Button>
        </div>
      </header>
      <main className="mt-8">
        <p className="text-cefide-muted">Dashboard admin — módulos próximos.</p>
      </main>
    </div>
  );
}
