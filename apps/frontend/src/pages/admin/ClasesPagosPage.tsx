import { useState } from 'react';
import { Search, Plus, DollarSign, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useApiGet } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { Actividad, InscripcionActividad, PaginatedResponse, FRECUENCIA_LABEL } from '@/types';
import { FRECUENCIA_LABEL as FL } from '@/types';

interface InscripcionFlat extends InscripcionActividad {
  alumno: { id: string; dni: string; nombre: string; apellido: string; activo: boolean };
}

interface NuevaInscripcionForm {
  alumnoId: string;
  actividadId: string;
  frecuencia: string;
}

export function ClasesPagosPage() {
  const token = useAuthStore((s) => s.token);
  const [search, setSearch] = useState('');
  const [filterActividad, setFilterActividad] = useState('all');
  const [page, setPage] = useState(1);

  // Clases sueltas dialog
  const [clasesDialog, setClasesDialog] = useState<string | null>(null);
  const [clasesValue, setClasesValue] = useState('');

  // Nueva inscripción dialog
  const [nuevaDialog, setNuevaDialog] = useState(false);
  const [nuevaForm, setNuevaForm] = useState<NuevaInscripcionForm>({ alumnoId: '', actividadId: '', frecuencia: 'DOS_VECES' });

  const { data: actividades } = useApiGet<Actividad[]>('/actividades?soloActivas=true');

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filterActividad !== 'all') params.set('actividadId', filterActividad);
  params.set('page', String(page));
  params.set('limit', '20');

  const { data, mutate } = useApiGet<PaginatedResponse<InscripcionFlat>>(
    `/inscripciones?${params.toString()}`,
  );

  async function handleTogglePago(ins: InscripcionFlat) {
    await api(`/inscripciones/${ins.id}/pagar`, {
      method: 'PATCH',
      body: JSON.stringify({ pagado: !ins.pagado }),
      token: token!,
    });
    mutate();
  }

  async function handleAgregarClases() {
    const num = parseInt(clasesValue, 10);
    if (!clasesDialog || isNaN(num) || num < 1) return;

    await api(`/inscripciones/${clasesDialog}/clases-sueltas`, {
      method: 'PATCH',
      body: JSON.stringify({ clases: num }),
      token: token!,
    });
    setClasesDialog(null);
    setClasesValue('');
    mutate();
  }

  async function handleNuevaInscripcion() {
    if (!nuevaForm.alumnoId || !nuevaForm.actividadId) return;

    await api('/inscripciones', {
      method: 'POST',
      body: JSON.stringify(nuevaForm),
      token: token!,
    });
    setNuevaDialog(false);
    setNuevaForm({ alumnoId: '', actividadId: '', frecuencia: 'DOS_VECES' });
    mutate();
  }

  function getEstadoBadge(ins: InscripcionFlat) {
    const restantes = ins.clasesTotal - ins.clasesUsadas;
    if (ins.pagado && restantes > 0) return <Badge variant="success">VERDE</Badge>;
    if (!ins.pagado && restantes > 0) return <Badge variant="warning">AMARILLO</Badge>;
    return <Badge variant="destructive">ROJO</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Inscripciones y Pagos</h2>
        <Button onClick={() => setNuevaDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Inscripción
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cefide-muted" />
          <Input
            placeholder="Buscar por DNI, nombre o apellido..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={filterActividad} onValueChange={(v) => { setFilterActividad(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas las actividades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las actividades</SelectItem>
            {actividades?.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-cefide-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cefide-surface">
            <tr className="border-b border-cefide-border">
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">DNI</th>
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">Alumno</th>
              <th className="px-4 py-3 text-left font-medium text-cefide-muted">Actividad</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Frecuencia</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Clases</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Pago</th>
              <th className="px-4 py-3 text-center font-medium text-cefide-muted">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-cefide-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((ins) => (
              <tr key={ins.id} className="border-b border-cefide-border hover:bg-cefide-surface/50 transition-colors">
                <td className="px-4 py-3 font-mono">{ins.alumno.dni}</td>
                <td className="px-4 py-3">{ins.alumno.apellido}, {ins.alumno.nombre}</td>
                <td className="px-4 py-3">{ins.actividad.nombre}</td>
                <td className="px-4 py-3 text-center text-cefide-muted">{FL[ins.frecuencia]}</td>
                <td className="px-4 py-3 text-center font-mono">
                  {ins.clasesUsadas}/{ins.clasesTotal}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={ins.pagado ? 'success' : 'destructive'}>
                    {ins.pagado ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center">{getEstadoBadge(ins)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setClasesDialog(ins.id); setClasesValue(''); }}
                      title="Agregar clases sueltas"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Clases
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePago(ins)}
                    >
                      <DollarSign className="mr-1 h-3 w-3" />
                      {ins.pagado ? 'Anular' : 'Cobrar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-cefide-muted">
                  No se encontraron inscripciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-cefide-muted">{data.total} inscripcion{data.total !== 1 ? 'es' : ''}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span className="flex items-center px-3 text-sm text-cefide-muted">{page} / {data.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Clases sueltas dialog */}
      <Dialog open={!!clasesDialog} onOpenChange={(v) => !v && setClasesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar clases sueltas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cantidad de clases a agregar</Label>
              <Input
                type="number"
                min="1"
                value={clasesValue}
                onChange={(e) => setClasesValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleAgregarClases(); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setClasesDialog(null)}>Cancelar</Button>
              <Button onClick={handleAgregarClases}>
                <Check className="mr-1 h-4 w-4" />
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nueva inscripción dialog */}
      <Dialog open={nuevaDialog} onOpenChange={(v) => !v && setNuevaDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Inscripción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID del Alumno</Label>
              <Input
                placeholder="ID del alumno"
                value={nuevaForm.alumnoId}
                onChange={(e) => setNuevaForm((f) => ({ ...f, alumnoId: e.target.value }))}
              />
              <p className="text-xs text-cefide-muted">Buscar en la pestaña Alumnos y copiar el ID</p>
            </div>
            <div className="space-y-2">
              <Label>Actividad</Label>
              <Select value={nuevaForm.actividadId} onValueChange={(v) => setNuevaForm((f) => ({ ...f, actividadId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar actividad" />
                </SelectTrigger>
                <SelectContent>
                  {actividades?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select value={nuevaForm.frecuencia} onValueChange={(v) => setNuevaForm((f) => ({ ...f, frecuencia: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNA_VEZ">1x semana (5 clases)</SelectItem>
                  <SelectItem value="DOS_VECES">2x semana (9 clases)</SelectItem>
                  <SelectItem value="TRES_VECES">3x semana (13 clases)</SelectItem>
                  <SelectItem value="LIBRE">Libre (30 clases)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNuevaDialog(false)}>Cancelar</Button>
              <Button onClick={handleNuevaInscripcion}>Crear</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
