import { config } from '@/config/env';

/**
 * Cliente del driver local del molinete.
 *
 * El driver corre en la MISMA PC que el navegador (localhost). Un front HTTPS
 * puede llamar a localhost sin bloqueo mixed-content. Cada PC abre/consulta
 * solo su propio molinete; NO se puede alcanzar el driver de otra PC por LAN.
 */

const DRIVER = config.driverBase;

export interface DriverResult {
  ok: boolean;
  error?: string;
}

export interface DriverStatus {
  ok: boolean;
  comPort?: string;
  pulseMs?: number;
  pin?: string;
  simulationMode?: boolean;
  error?: string;
}

/** Envía pulso de apertura al molinete local. */
export async function abrirMolineteLocal(): Promise<DriverResult> {
  try {
    const res = await fetch(`${DRIVER}/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'sin conexión' };
  }
}

/** Estado del driver local. */
export async function statusMolineteLocal(): Promise<DriverStatus> {
  try {
    const res = await fetch(`${DRIVER}/status`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'No responde' };
  }
}
