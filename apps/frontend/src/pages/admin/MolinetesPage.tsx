import { useState, useEffect, useRef } from 'react';
import { Zap, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { abrirMolineteLocal, statusMolineteLocal, type DriverStatus } from '@/lib/molinete';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Panel admin del molinete.
 *
 * El driver corre en la MISMA PC que este navegador (localhost). Cada PC
 * controla SOLO su propio molinete; no se puede alcanzar el driver de otra PC.
 * El número de molinete (para el log en el backend) sale de `?molinete=1|2`.
 */
function getMolineteFromUrl(): number {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('molinete') || '1', 10);
}

export function MolinetesPage() {
  const token = useAuthStore((s) => s.token);
  const num = useRef(getMolineteFromUrl());
  const [status, setStatus] = useState<DriverStatus | null>(null);
  const [opening, setOpening] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  async function fetchStatus() {
    setStatus(await statusMolineteLocal(num.current));
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleContingencia() {
    setOpening(true);
    setLastAction(null);

    // 1. Apertura física contra el proxy local de esta PC.
    const apertura = await abrirMolineteLocal(num.current);

    // 2. Registrar la contingencia en el backend (auditoría), aunque la
    //    apertura física la hizo el navegador.
    try {
      await api(`/molinete/${num.current}/contingencia`, {
        method: 'POST',
        body: JSON.stringify({ motivo: 'Apertura manual desde panel admin' }),
        token: token!,
      });
    } catch {
      /* el log es secundario; no bloquea la apertura */
    }

    setLastAction(
      apertura.ok
        ? `Molinete ${num.current} abierto correctamente`
        : `Error al abrir: ${apertura.error}`,
    );
    setOpening(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Molinete {num.current}</h2>
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

      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Molinete {num.current}</CardTitle>
          {status ? (
            status.ok ? (
              <Badge variant={status.online === false ? 'warning' : 'success'}>
                {status.online === false ? 'ESP sin responder' : 'Conectado'}
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
                  <p>Estado ESP: {status.estado ?? '—'}</p>
                  <p>Alcanzable: {status.online === false ? 'no' : 'sí'}</p>
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
            disabled={opening}
            onClick={handleContingencia}
          >
            <Zap className="mr-2 h-5 w-5" />
            {opening ? 'Abriendo...' : 'Apertura de Contingencia'}
          </Button>

          <p className="text-xs text-cefide-muted flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Abre sin validar estado del alumno
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
