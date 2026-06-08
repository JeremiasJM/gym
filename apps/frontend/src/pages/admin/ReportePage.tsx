import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApiGet } from '@/hooks/use-api';
import { useAuthStore } from '@/stores/auth.store';
import { config } from '@/config/env';
import type { Profesor } from '@/types';

interface ReporteAlumno {
  dni: string;
  nombre: string;
  apellido: string;
  profesor: string;
  clasesTotal: number;
  clasesUsadas: number;
  clasesRestantes: number;
  pagado: boolean;
  fechaPago: string | null;
}

const PAGE_SIZE = 20;

export function ReportePage() {
  const token = useAuthStore((s) => s.token);
  const [filterProfesor, setFilterProfesor] = useState('all');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (filterProfesor !== 'all') params.set('profesorId', filterProfesor);

  const { data } = useApiGet<ReporteAlumno[]>(
    `/reportes/actividad?${params.toString()}`,
  );
  const { data: profesores } = useApiGet<Profesor[]>('/profesores');

  const total = data?.length ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paginated = data?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  function handleExportCsv() {
    const csvParams = new URLSearchParams();
    if (filterProfesor !== 'all') csvParams.set('profesorId', filterProfesor);

    const url = `${config.apiBase}/reportes/actividad/csv?${csvParams.toString()}`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `reporte-cefide-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  }

  function getEstadoBadge(item: ReporteAlumno) {
    if (item.pagado && item.clasesRestantes > 0)
      return <Badge variant="success">VERDE</Badge>;
    if (!item.pagado && item.clasesRestantes > 0)
      return <Badge variant="warning">AMARILLO</Badge>;
    return <Badge variant="destructive">ROJO</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reporte de Actividad</h2>
        <Button onClick={handleExportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Select
        value={filterProfesor}
        onValueChange={(v) => {
          setFilterProfesor(v);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Todos los profesores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los profesores</SelectItem>
          {profesores?.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.apellido}, {p.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="rounded-lg border border-cefide-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cefide-surface">
            <tr className="border-b border-cefide-border">
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">DNI</th>
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">Profesor</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Realizadas</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Restantes</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Pago</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Estado</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item) => (
              <tr key={item.dni} className="border-b border-cefide-border hover:bg-cefide-surface/50">
                <td className="px-4 py-3 font-mono">{item.dni}</td>
                <td className="px-4 py-3">{item.apellido}, {item.nombre}</td>
                <td className="px-4 py-3 text-cefide-muted">{item.profesor}</td>
                <td className="px-4 py-3 text-center font-mono">{item.clasesUsadas}</td>
                <td className="px-4 py-3 text-center font-mono">{item.clasesRestantes}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={item.pagado ? 'success' : 'destructive'}>
                    {item.pagado ? 'Sí' : 'No'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">{getEstadoBadge(item)}</td>
              </tr>
            ))}
            {total === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-cefide-muted">
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-cefide-muted">
          {total} alumno{total !== 1 ? 's' : ''} activo{total !== 1 ? 's' : ''}
        </p>
        {totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
}
