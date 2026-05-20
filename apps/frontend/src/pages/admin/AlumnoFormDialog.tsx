import { useState, useEffect, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useApiGet } from '@/hooks/use-api';
import type { Alumno, Profesor } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  alumno?: Alumno | null;
}

export function AlumnoFormDialog({ open, onClose, onSuccess, alumno }: Props) {
  const token = useAuthStore((s) => s.token);
  const { data: profesores } = useApiGet<Profesor[]>('/profesores');

  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [profesorId, setProfesorId] = useState<string>('none');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!alumno;

  useEffect(() => {
    if (alumno) {
      setDni(alumno.dni);
      setNombre(alumno.nombre);
      setApellido(alumno.apellido);
      setProfesorId(alumno.profesorId ?? 'none');
    } else {
      setDni('');
      setNombre('');
      setApellido('');
      setProfesorId('none');
    }
    setError('');
  }, [alumno, open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const body = {
      dni,
      nombre,
      apellido,
      profesorId: profesorId === 'none' ? null : profesorId,
    };

    try {
      if (isEdit) {
        await api(`/alumnos/${alumno!.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
          token: token!,
        });
      } else {
        await api('/alumnos', {
          method: 'POST',
          body: JSON.stringify(body),
          token: token!,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Alumno' : 'Nuevo Alumno'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dni">DNI</Label>
            <Input
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="12345678"
              required
              minLength={7}
              maxLength={8}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                minLength={2}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Profesor</Label>
            <Select value={profesorId} onValueChange={setProfesorId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin profesor asignado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin profesor</SelectItem>
                {profesores?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.apellido}, {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-cefide-accent-alt">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
