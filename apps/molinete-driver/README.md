# Molinete Driver — DCM PCA150

Servicio local Node.js que controla el molinete físico via puerto serie (COM).

**IMPORTANTE:** Este servicio DEBE correr en la PC física conectada al molinete. No puede correr en la nube.

## Setup

```bash
cd apps/molinete-driver
pnpm install
```

## Variables de entorno

```env
DRIVER_PORT=3001       # Puerto HTTP del driver
COM_PORT=COM1          # Puerto serie conectado a la PCA150
COM_PULSE_MS=500       # Duración del pulso en ms (no cambiar sin verificar spec)
```

## Ejecución

```bash
# Molinete 1
DRIVER_PORT=3001 COM_PORT=COM1 pnpm dev

# Molinete 2 (otra PC o misma con 2 puertos)
DRIVER_PORT=3002 COM_PORT=COM2 pnpm dev
```

## Endpoints

- `POST /abrir` — Envía pulso al molinete. Body: `{ "pin": "HAB1" }`
- `GET /status` — Health check del driver y puerto COM

## Modo simulación

Si `serialport` no puede abrirse (ej: en dev sin hardware), el driver funciona en modo simulación: logea el pulso pero no envía datos reales.

## Hardware

- **Placa:** DCM PCA150
- **Protocolo:** Contacto seco, pulso 500ms en pin Habilitación Entrada
- **Conexión:** Puerto COM (RS-232 o USB-Serial)
