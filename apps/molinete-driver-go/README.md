# Molinete Driver / Proxy — (Go)

`.exe` único que corre en la PC del gym y expone un endpoint HTTP en
`localhost` que el navegador del kiosco puede llamar (`localhost` está exento
del bloqueo mixed-content, por eso un front HTTPS puede llamarlo). Cero
dependencias en runtime.

## Dos modos (`config.json` → `mode`)

- **`proxy`** (default) — el molinete es un dispositivo de **red con IP**. El
  driver reenvía el POST a esa URL (`target`). No usa puerto serie.
- **`serial`** — el molinete va por **cable** (placa PCA150 por COM). El driver
  manda el pulso por el puerto serie.

```
proxy:   Browser → POST localhost:3001/abrir → driver → POST http://IP-molinete/...
serial:  Browser → POST localhost:3001/abrir → driver → bytes por COM → placa PCA150
```

## Build (una vez, en máquina con Go)

```powershell
cd apps/molinete-driver-go
go mod tidy
go build -o molinete-driver.exe .
```

Cross-compile: `GOOS=windows GOARCH=amd64 go build -o molinete-driver.exe .`

## config.json

Modo proxy:
```json
{
  "http_port": 3001,
  "mode": "proxy",
  "allow_origin": "https://cefide-client.fmtcloud.com.ar",
  "timeout_ms": 5000,
  "target": "http://molinete1.local:3001/molinete1"
}
```

Modo serial:
```json
{
  "http_port": 3001,
  "mode": "serial",
  "allow_origin": "https://cefide-client.fmtcloud.com.ar",
  "com_port": "COM1",
  "pulse_ms": 500,
  "pin": "HAB1"
}
```

- `target` (proxy) — URL real del molinete en la red. El driver reenvía el POST tal cual.
- `com_port` (serial) — puerto de la placa. Sin placa → modo simulación.
- `allow_origin` — origin del front. `"*"` permite cualquiera.

## Ejecución

```powershell
.\molinete-driver.exe
```

Lee `config.json` del mismo directorio. Autostart: Task Scheduler ("al iniciar sesión").

## Endpoints

- `POST /abrir` — proxy: reenvía a `target` y devuelve su respuesta. serial: pulso al COM.
- `GET /status` — proxy: `{mode, target, reachable}`. serial: `{mode, comPort, simulationMode}`.

## Protocolo serial (modo serial)

Placa DCM PCA150, contacto seco. Pulso `pulse_ms`: `0x01`(HAB1)/`0x02`(HAB2),
espera, `0x00`. COM 9600 8N1.
