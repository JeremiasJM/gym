# Molinete Driver — DCM PCA150 (Go)

`.exe` único que controla el molinete físico via puerto serie (COM).
DEBE correr en la PC física conectada al molinete. Cero dependencias en runtime.

## Build (una vez, en máquina con Go instalado)

```powershell
cd apps/molinete-driver-go
go mod tidy          # baja go.bug.st/serial, genera go.sum
go build -o molinete-driver.exe .
```

Resultado: `molinete-driver.exe` estático. Copiás eso + `config.json` a cada PC. No hace falta Go ni Node en la PC del gym.

### Cross-compile desde otro SO

```bash
GOOS=windows GOARCH=amd64 go build -o molinete-driver.exe .
```

## config.json (al lado del .exe)

```json
{
  "http_port": 3001,
  "com_port": "COM1",
  "pulse_ms": 500,
  "pin": "HAB1",
  "allow_origin": "https://TU-FRONT.com"
}
```

- `com_port` — puerto serie de la placa (COM1, COM3, etc.).
- `pin` — `HAB1` o `HAB2`. Con 2 PCs separadas, cada una usa `HAB1` (abre su aparato).
- `allow_origin` — origin del front en la nube. `"*"` permite cualquiera (menos seguro).

## Ejecución

```powershell
.\molinete-driver.exe
```

Lee `config.json` del mismo directorio. Para autostart: Task Scheduler de Windows (trigger "al iniciar sesión").

## Endpoints

- `POST /abrir` — envía pulso al molinete. Body vacío `{}` o `{ "pin": "HAB1" }` (ignora pin del body; usa el de config).
- `GET /status` — health check.

## Modo simulación

Si el COM no se puede abrir (dev sin hardware), arranca en modo simulación: logea el pulso, no manda datos reales.

## Protocolo

- Placa: DCM PCA150, contacto seco.
- Pulso `pulse_ms` (500ms): escribe `0x01`(HAB1)/`0x02`(HAB2), espera, escribe `0x00`.
- COM: 9600 8N1.
