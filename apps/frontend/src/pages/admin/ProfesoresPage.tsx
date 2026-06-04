import { useState } from 'react';
import { Plus, Trash2, Mail, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApiGet } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ProfesorFormDialog } from './ProfesorFormDialog';
import type { Profesor } from '@/types';

const PAGE_SIZE = 20;

export function ProfesoresPage() {
  const token = useAuthStore((s) => s.token);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewProfesor, setViewProfesor] = useState<Profesor | null>(null);
  const [page, setPage] = useState(1);

  const { data: profesores, mutate } = useApiGet<Profesor[]>('/profesores');

  const total = profesores?.length ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paginated = profesores?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  async function handleDelete(profesor: Profesor) {
    if (!confirm(`¿Eliminar a ${profesor.nombre} ${profesor.apellido}? Solo es posible si no tiene alumnos asignados.`)) return;

    try {
      await api(`/profesores/${profesor.id}`, {
        method: 'DELETE',
        token: token!,
      });
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Profesores</h2>
        <Button onClick={() => { setViewProfesor(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Profesor
        </Button>
      </div>

      <div className="rounded-lg border border-cefide-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cefide-surface">
            <tr className="border-b border-cefide-border">
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">DNI</th>
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">Email</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Alumnos</th>
              <th className="px-4 py-3 text-right font-medium text-cefide-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((profesor) => (
              <tr
                key={profesor.id}
                className="border-b border-cefide-border hover:bg-cefide-surface/50 transition-colors"
              >
                <td className="px-4 py-3 font-mono">{profesor.dni}</td>
                <td className="px-4 py-3">
                  {profesor.apellido}, {profesor.nombre}
                </td>
                <td className="px-4 py-3">
                  {profesor.usuario ? (
                    <span className="flex items-center gap-1 text-cefide-muted">
                      <Mail className="h-3 w-3" />
                      {profesor.usuario.email}
                    </span>
                  ) : (
                    <Badge variant="muted">Sin cuenta</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-mono">
                  {profesor._count?.alumnos ?? 0}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setViewProfesor(profesor); setDialogOpen(true); }}
                      title="Editar profesor"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(profesor)}
                      title="Eliminar profesor"
                    >
                      <Trash2 className="h-4 w-4 text-cefide-accent-alt" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {total === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-cefide-muted">
                  No hay profesores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-cefide-muted">
            {total} profesor{total !== 1 ? 'es' : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm text-cefide-muted">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <ProfesorFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => mutate()}
        profesor={viewProfesor}
      />
    </div>
  );
}
