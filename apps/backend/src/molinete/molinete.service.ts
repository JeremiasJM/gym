import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DriverResponse {
  ok: boolean;
  error?: string;
  pin?: string;
  comPort?: string;
  pulseMs?: number;
}

export interface DriverStatus {
  ok: boolean;
  serialAvailable?: boolean;
  portOpen?: boolean;
  simulationMode?: boolean;
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

  /**
   * Envía señal de apertura al molinete especificado
   * @param molinete Número de molinete (1 o 2)
   * @param pin Pin de habilitación (HAB1 o HAB2)
   */
  async abrir(molinete: number = 1, pin: string = 'HAB1'): Promise<DriverResponse> {
    const url = this.driverUrls[molinete - 1];
    if (!url) {
      return { ok: false, error: `Molinete ${molinete} no configurado` };
    }

    this.logger.log(`Enviando apertura a molinete ${molinete} (${url}), pin: ${pin}`);

    try {
      const res = await fetch(`${url}/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
        signal: AbortSignal.timeout(5000),
      });

      const data: DriverResponse = await res.json();

      if (!data.ok) {
        this.logger.error(`Driver molinete ${molinete} respondió con error: ${data.error}`);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      this.logger.error(`No se pudo conectar al driver molinete ${molinete}: ${message}`);
      return { ok: false, error: `Driver molinete ${molinete} no responde: ${message}` };
    }
  }

  /**
   * Consulta estado del driver de un molinete
   */
  async status(molinete: number = 1): Promise<DriverStatus> {
    const url = this.driverUrls[molinete - 1];
    if (!url) {
      return { ok: false, error: `Molinete ${molinete} no configurado` };
    }

    try {
      const res = await fetch(`${url}/status`, {
        signal: AbortSignal.timeout(3000),
      });
      return await res.json();
    } catch {
      return { ok: false, error: `Driver molinete ${molinete} no responde` };
    }
  }
}
