import { useState } from 'react';
import { Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useApiGet } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth.store';
import type { Alumno, PaginatedResponse } from '@/types';

export function ProfesorDashboard() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('limit', '50');

  const { data } = useApiGet<PaginatedResponse<Alumno>>(
    `/alumnos?${params.toString()}`,
  );

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function getEstadoBadge(alumno: Alumno) {
    if (alumno.pagado && alumno.clasesTotal - alumno.clasesUsadas > 0)
      return <Badge variant="success">VERDE</Badge>;
    if (!alumno.pagado && alumno.clasesTotal - alumno.clasesUsadas > 0)
      return <Badge variant="warning">AMARILLO</Badge>;
    return <Badge variant="destructive">ROJO</Badge>;
  }

  return (
    <div className="min-h-screen bg-cefide-bg">
      <header className="border-b border-cefide-border p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cefide-accent">CEFIDE</h1>
          <p className="text-sm text-cefide-muted">
            Profesor — {usuario?.nombre} {usuario?.apellido}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-cefide-muted">{usuario?.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Buscar Alumno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cefide-muted" />
              <Input
                placeholder="Buscar por DNI, nombre o apellido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        {data && data.data.length > 0 && (
          <div className="rounded-lg border border-cefide-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cefide-surface">
                <tr className="border-b border-cefide-border">
                  <th className="px-4 py-3 text-left font-medium text-cefide-muted">DNI</th>
                  <th className="px-4 py-3 text-left font-medium text-cefide-muted">Nombre</th>
                  <th className="px-4 py-3 text-center font-medium text-cefide-muted">Clases</th>
                  <th className="px-4 py-3 text-center font-medium text-cefide-muted">Pago</th>
                  <th className="px-4 py-3 text-center font-medium text-cefide-muted">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((alumno) => (
                  <tr key={alumno.id} className="border-b border-cefide-border hover:bg-cefide-surface/50">
                    <td className="px-4 py-3 font-mono">{alumno.dni}</td>
                    <td className="px-4 py-3">{alumno.apellido}, {alumno.nombre}</td>
                    <td className="px-4 py-3 text-center font-mono">
                      {alumno.clasesUsadas}/{alumno.clasesTotal}
                      <span className="text-cefide-muted ml-1">
                        ({alumno.clasesTotal - alumno.clasesUsadas} restante{alumno.clasesTotal - alumno.clasesUsadas !== 1 ? 's' : ''})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={alumno.pagado ? 'success' : 'destructive'}>
                        {alumno.pagado ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getEstadoBadge(alumno)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.data.length === 0 && search && (
          <p className="text-center text-cefide-muted py-8">
            No se encontraron alumnos
          </p>
        )}

        {!search && (
          <p className="text-center text-cefide-muted py-8">
            Ingrese un DNI o nombre para buscar
          </p>
        )}
      </main>
    </div>
  );
}
