import { useState, useEffect } from 'react';
import { Zap, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface MolineteStatus {
  ok: boolean;
  serialAvailable?: boolean;
  portOpen?: boolean;
  simulationMode?: boolean;
  error?: string;
}

interface MolineteConfig {
  num: number;
  label: string;
}

const MOLINETES: MolineteConfig[] = [
  { num: 1, label: 'Molinete 1' },
  { num: 2, label: 'Molinete 2' },
];

export function MolinetesPage() {
  const token = useAuthStore((s) => s.token);
  const [statuses, setStatuses] = useState<Record<number, MolineteStatus>>({});
  const [opening, setOpening] = useState<number | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  async function fetchStatus(num: number) {
    try {
      const status = await api<MolineteStatus>(`/molinete/${num}/status`, {
        token: token!,
      });
      setStatuses((prev) => ({ ...prev, [num]: status }));
    } catch {
      setStatuses((prev) => ({
        ...prev,
        [num]: { ok: false, error: 'No responde' },
      }));
    }
  }

  useEffect(() => {
    MOLINETES.forEach((m) => fetchStatus(m.num));
    const interval = setInterval(() => {
      MOLINETES.forEach((m) => fetchStatus(m.num));
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  async function handleContingencia(num: number) {
    setOpening(num);
    setLastAction(null);
    try {
      const res = await api<{ ok: boolean; error?: string }>(
        `/molinete/${num}/contingencia`,
        {
          method: 'POST',
          body: JSON.stringify({ motivo: 'Apertura manual desde panel admin' }),
          token: token!,
        },
      );
      setLastAction(
        res.ok
          ? `Molinete ${num} abierto correctamente`
          : `Error: ${res.error}`,
      );
    } catch (err) {
      setLastAction(
        `Error: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      );
    } finally {
      setOpening(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Molinetes</h2>
        <div className="flex items-center gap-2 text-sm text-cefide-muted">
          <Activity className="h-4 w-4" />
          Estado en tiempo real (cada 10s)
        </div>
      </div>

      {lastAction && (
        <div className="rounded-md border border-cefide-border bg-cefide-surface p-3 text-sm">
          {lastAction}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOLINETES.map((m) => {
          const status = statuses[m.num];

          return (
            <Card key={m.num}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">{m.label}</CardTitle>
                {status ? (
                  status.ok ? (
                    <Badge variant={status.simulationMode ? 'warning' : 'success'}>
                      {status.simulationMode ? 'Simulación' : 'Conectado'}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Desconectado</Badge>
                  )
                ) : (
                  <Badge variant="muted">Cargando...</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {status && (
                  <div className="text-sm text-cefide-muted space-y-1">
                    {status.ok ? (
                      <>
                        <p>Serial: {status.serialAvailable ? 'Disponible' : 'No disponible'}</p>
                        <p>Puerto: {status.portOpen ? 'Abierto' : 'Cerrado'}</p>
                      </>
                    ) : (
                      <p className="text-cefide-accent-alt">{status.error}</p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant="destructive"
                  size="lg"
                  disabled={opening === m.num}
                  onClick={() => handleContingencia(m.num)}
                >
                  <Zap className="mr-2 h-5 w-5" />
                  {opening === m.num ? 'Abriendo...' : 'Apertura de Contingencia'}
                </Button>

                <p className="text-xs text-cefide-muted flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Abre sin validar estado del alumno
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
