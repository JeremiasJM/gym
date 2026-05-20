/**
 * Control de puerto serie para placa DCM PCA150
 *
 * Protocolo: contacto seco, pulso de 500ms en pin Habilitación Entrada
 * - HAB1: pin de habilitación molinete entrada 1
 * - HAB2: pin de habilitación molinete entrada 2
 *
 * El pulso activa el relé de la PCA150 que libera el molinete.
 * Después de 500ms se desactiva automáticamente.
 */

let SerialPort: any;
let serialAvailable = false;

// Intentar cargar serialport — puede no estar disponible en dev
try {
  const sp = require('serialport');
  SerialPort = sp.SerialPort;
  serialAvailable = true;
} catch {
  console.warn('[WARN] serialport no disponible — modo simulación activo');
}

// Mapeo de pines a bytes de comando para la PCA150
// Estos valores dependen de la configuración específica de la placa
const PIN_COMMANDS: Record<string, Buffer> = {
  HAB1: Buffer.from([0x01]), // Activar habilitación entrada 1
  HAB2: Buffer.from([0x02]), // Activar habilitación entrada 2
};

const PIN_RELEASE: Record<string, Buffer> = {
  HAB1: Buffer.from([0x00]), // Desactivar habilitación entrada 1
  HAB2: Buffer.from([0x00]), // Desactivar habilitación entrada 2
};

// Cache de puertos abiertos
const openPorts = new Map<string, any>();

function getOrOpenPort(comPort: string): Promise<any> {
  if (openPorts.has(comPort)) {
    return Promise.resolve(openPorts.get(comPort));
  }

  if (!serialAvailable) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const port = new SerialPort({
      path: comPort,
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
    });

    port.on('open', () => {
      console.log(`[SERIAL] Puerto ${comPort} abierto`);
      openPorts.set(comPort, port);
      resolve(port);
    });

    port.on('error', (err: Error) => {
      console.error(`[SERIAL] Error en ${comPort}: ${err.message}`);
      openPorts.delete(comPort);
      reject(err);
    });

    port.on('close', () => {
      console.log(`[SERIAL] Puerto ${comPort} cerrado`);
      openPorts.delete(comPort);
    });
  });
}

/**
 * Envía pulso al molinete:
 * 1. Escribe comando de activación al pin
 * 2. Espera exactamente PULSE_MS (500ms según spec PCA150)
 * 3. Escribe comando de desactivación
 */
export async function abrirMolinete(
  comPort: string,
  pin: string,
  pulseMs: number,
): Promise<void> {
  const activateCmd = PIN_COMMANDS[pin];
  const releaseCmd = PIN_RELEASE[pin];

  if (!activateCmd) {
    throw new Error(`Pin desconocido: ${pin}. Usar HAB1 o HAB2`);
  }

  // Modo simulación si serialport no disponible
  if (!serialAvailable) {
    console.log(`[SIM] Pulso ${pulseMs}ms en ${pin} (${comPort}) — simulado`);
    await sleep(pulseMs);
    return;
  }

  const port = await getOrOpenPort(comPort);

  // Activar relé
  await writeToPort(port, activateCmd);

  // Mantener pulso exactamente el tiempo especificado
  await sleep(pulseMs);

  // Desactivar relé
  await writeToPort(port, releaseCmd);
}

export function getStatus(comPort: string) {
  return {
    serialAvailable,
    portOpen: openPorts.has(comPort),
    simulationMode: !serialAvailable,
  };
}

function writeToPort(port: any, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    port.write(data, (err: Error | null) => {
      if (err) reject(err);
      else {
        port.drain((drainErr: Error | null) => {
          if (drainErr) reject(drainErr);
          else resolve();
        });
      }
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
