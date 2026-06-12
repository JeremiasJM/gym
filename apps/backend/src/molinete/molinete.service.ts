import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DriverResponse {
  ok: boolean;
  error?: string;
}

export interface DriverStatus {
  ok: boolean;
  error?: string;
}

@Injectable()
export class MolineteService {
  private readonly logger = new Logger(MolineteService.name);
  private readonly driverUrls: string[];

  constructor(private readonly config: ConfigService) {
    this.driverUrls = [
      config.get<string>('COM_SERVICE_URL_1', 'http://localhost:3001'),
      config.get<string>('COM_SERVICE_URL_2', 'http://localhost:3002'),
    ];
  }

  async abrir(molinete: number = 1): Promise<DriverResponse> {
    const url = this.driverUrls[molinete - 1];
    if (!url) {
      return { ok: false, error: `Molinete ${molinete} no configurado` };
    }

    this.logger.log(`Abriendo molinete ${molinete} → POST ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abrir: 1 }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        this.logger.error(`Molinete ${molinete} respondió HTTP ${res.status}`);
        return { ok: false, error: `HTTP ${res.status}` };
      }

      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      this.logger.error(`Molinete ${molinete} no responde: ${message}`);
      return { ok: false, error: message };
    }
  }

  async status(molinete: number = 1): Promise<DriverStatus> {
    const url = this.driverUrls[molinete - 1];
    if (!url) {
      return { ok: false, error: `Molinete ${molinete} no configurado` };
    }

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
    } catch {
      return { ok: false, error: `Molinete ${molinete} no responde` };
    }
  }
}
