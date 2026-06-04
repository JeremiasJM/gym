import { useState } from 'react';
import { Search, DollarSign, BookOpen, Check, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApiGet } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { Alumno, PaginatedResponse } from '@/types';

export function ClasesPagosPage() {
  const token = useAuthStore((s) => s.token);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Inline edit state
  const [editingClases, setEditingClases] = useState<string | null>(null);
  const [clasesValue, setClasesValue] = useState('');
  const [renovarId, setRenovarId] = useState<string | null>(null);
  const [renovarValue, setRenovarValue] = useState('');

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('limit', '20');
  params.set('activo', 'true');

  const { data, mutate } = useApiGet<PaginatedResponse<Alumno>>(
    `/alumnos?${params.toString()}`,
  );

  async function handleAsignarClases(id: string) {
    const num = parseInt(clasesValue, 10);
    if (isNaN(num) || num < 1) return;

    await api(`/alumnos/${id}/clases`, {
      method: 'PATCH',
      body: JSON.stringify({ clasesTotal: num }),
      token: token!,
    });
    setEditingClases(null);
    mutate();
  }

  async function handleRenovar(id: string) {
    const num = parseInt(renovarValue, 10);
    if (isNaN(num) || num < 1) return;

    await api(`/alumnos/${id}/renovar`, {
      method: 'PATCH',
      body: JSON.stringify({ clasesTotal: num }),
      token: token!,
    });
    setRenovarId(null);
    mutate();
  }

  async function handleTogglePago(alumno: Alumno) {
    await api(`/alumnos/${alumno.id}/pago`, {
      method: 'PATCH',
      body: JSON.stringify({ pagado: !alumno.pagado }),
      token: token!,
    });
    mutate();
  }

  function getEstadoBadge(alumno: Alumno) {
    if (alumno.pagado && alumno.clasesTotal - alumno.clasesUsadas > 0) {
      return <Badge variant="success">VERDE</Badge>;
    }
    if (!alumno.pagado && alumno.clasesTotal - alumno.clasesUsadas > 0) {
      return <Badge variant="warning">AMARILLO</Badge>;
    }
    return <Badge variant="destructive">ROJO</Badge>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Clases y Pagos</h2>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cefide-muted" />
        <Input
          placeholder="Buscar por DNI, nombre o apellido..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-cefide-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cefide-surface">
            <tr className="border-b border-cefide-border">
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">DNI</th>
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">Profesor</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Clases</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Pago</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-cefide-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((alumno) => (
              <tr
                key={alumno.id}
                className="border-b border-cefide-border hover:bg-cefide-surface/50 transition-colors"
              >
                <td className="px-4 py-3 font-mono">{alumno.dni}</td>
                <td className="px-4 py-3">
                  {alumno.apellido}, {alumno.nombre}
                </td>
                <td className="px-4 py-3 text-cefide-muted">
                  {alumno.profesor
                    ? `${alumno.profesor.apellido}, ${alumno.profesor.nombre}`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingClases === alumno.id ? (
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        value={clasesValue}
                        onChange={(e) => setClasesValue(e.target.value)}
                        className="w-20 h-8 text-center"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAsignarClases(alumno.id);
                          if (e.key === 'Escape') setEditingClases(null);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleAsignarClases(alumno.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingClases(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="font-mono cursor-pointer hover:text-cefide-accent"
                      onClick={() => {
                        setEditingClases(alumno.id);
                        setClasesValue(String(alumno.clasesTotal));
                      }}
                    >
                      {alumno.clasesUsadas}/{alumno.clasesTotal}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {alumno.pagado ? (
                    <Badge variant="success">Pagado</Badge>
                  ) : (
                    <Badge variant="destructive">Pendiente</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {getEstadoBadge(alumno)}
                </td>
                <td className="px-4 py-3 text-right">
                  {renovarId === alumno.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-cefide-muted mr-1">Nuevo total:</span>
                      <Input
                        type="number"
                        min="1"
                        value={renovarValue}
                        onChange={(e) => setRenovarValue(e.target.value)}
                        className="w-20 h-8 text-center"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenovar(alumno.id);
                          if (e.key === 'Escape') setRenovarId(null);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRenovar(alumno.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setRenovarId(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRenovarId(alumno.id);
                          setRenovarValue(String(alumno.clasesTotal));
                        }}
                        title="Renovar clases (resetea usadas a 0)"
                      >
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Renovar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePago(alumno)}
                        title={alumno.pagado ? 'Marcar como no pagado' : 'Registrar pago'}
                      >
                        <DollarSign className="mr-1 h-4 w-4" />
                        {alumno.pagado ? 'Anular pago' : 'Cobrar'}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-cefide-muted">
                  No se encontraron alumnos activos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-cefide-muted">
            {data.total} alumno{data.total !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm text-cefide-muted">
              {page} / {data.totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
