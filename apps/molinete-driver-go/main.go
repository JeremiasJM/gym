// Molinete Driver / Proxy — DCM PCA150 (Go)
//
// Corre en la PC del gym. Expone un endpoint HTTP en localhost que el
// navegador del kiosco puede llamar (localhost está exento del bloqueo
// mixed-content de los navegadores).
//
// Dos modos, elegidos en config.json -> "mode":
//
//   "proxy"   El molinete es un dispositivo de RED con IP. El driver reenvía
//             el POST a esa IP (ej: http://molinete1.local:3001/molinete1).
//             No usa el puerto serie.
//
//   "serial"  El molinete se controla por CABLE (placa PCA150 por COM).
//             El driver manda el pulso por el puerto serie:
//               HAB1 -> 0x01 (activar) / 0x00 (liberar)
//               HAB2 -> 0x02 (activar) / 0x00 (liberar)
//             9600 8N1, pulso de pulse_ms.
package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"go.bug.st/serial"
)

type Config struct {
	HTTPPort    int    `json:"http_port"`
	Mode        string `json:"mode"`         // "proxy" | "serial"
	AllowOrigin string `json:"allow_origin"` // origin del front (CORS), "*" permite todos
	TimeoutMs   int    `json:"timeout_ms"`   // timeout al reenviar/abrir

	// --- modo proxy ---
	Target string `json:"target"` // URL del molinete en la red, ej http://molinete1.local:3001/molinete1

	// --- modo serial ---
	ComPort string `json:"com_port"`
	PulseMs int    `json:"pulse_ms"`
	Pin     string `json:"pin"` // HAB1 | HAB2
}

var pinActivate = map[string]byte{"HAB1": 0x01, "HAB2": 0x02}

const pinRelease byte = 0x00

var (
	cfg     Config
	portMu  sync.Mutex // serializa accesos al COM
	simMode bool       // solo aplica en modo serial
)

func loadConfig() Config {
	c := Config{
		HTTPPort: 3001, Mode: "proxy", AllowOrigin: "*", TimeoutMs: 5000,
		Target: "", ComPort: "COM1", PulseMs: 500, Pin: "HAB1",
	}

	exe, _ := os.Executable()
	path := filepath.Join(filepath.Dir(exe), "config.json")
	data, err := os.ReadFile(path)
	if err != nil {
		log.Printf("[WARN] config.json no encontrado (%s) — usando defaults", path)
		return c
	}
	if err := json.Unmarshal(data, &c); err != nil {
		log.Fatalf("[FATAL] config.json inválido: %v", err)
	}
	if c.Mode == "" {
		c.Mode = "proxy"
	}
	return c
}

func timeout() time.Duration {
	if cfg.TimeoutMs <= 0 {
		return 5 * time.Second
	}
	return time.Duration(cfg.TimeoutMs) * time.Millisecond
}

// ── modo proxy ───────────────────────────────────────────────

// forwardAbrir reenvía el POST al molinete de red.
func forwardAbrir(w http.ResponseWriter, r *http.Request) {
	if cfg.Target == "" {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"ok": false, "error": "config.target vacío"})
		return
	}

	body, _ := io.ReadAll(r.Body)
	req, err := http.NewRequest(http.MethodPost, cfg.Target, bytes.NewReader(body))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"ok": false, "error": err.Error()})
		return
	}
	ct := r.Header.Get("Content-Type")
	if ct == "" {
		ct = "application/json"
	}
	req.Header.Set("Content-Type", ct)

	client := &http.Client{Timeout: timeout()}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR] proxy → %s: %v", cfg.Target, err)
		writeJSON(w, http.StatusBadGateway, map[string]any{"ok": false, "error": err.Error()})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	log.Printf("[OK] proxy → %s (HTTP %d)", cfg.Target, resp.StatusCode)

	// Devolver tal cual lo que respondió el molinete.
	if ctResp := resp.Header.Get("Content-Type"); ctResp != "" {
		w.Header().Set("Content-Type", ctResp)
	}
	w.WriteHeader(resp.StatusCode)
	w.Write(respBody)
}

// proxyReachable intenta alcanzar el target (best-effort) para el status.
func proxyReachable() bool {
	if cfg.Target == "" {
		return false
	}
	client := &http.Client{Timeout: 2 * time.Second}
	// HEAD primero; si el device no lo soporta, probamos GET.
	if resp, err := client.Head(cfg.Target); err == nil {
		resp.Body.Close()
		return true
	}
	if resp, err := client.Get(cfg.Target); err == nil {
		resp.Body.Close()
		return true
	}
	return false
}

// ── modo serial ──────────────────────────────────────────────

func abrirSerial() error {
	portMu.Lock()
	defer portMu.Unlock()

	activate, ok := pinActivate[cfg.Pin]
	if !ok {
		log.Printf("[WARN] pin desconocido %q — usando HAB1", cfg.Pin)
		activate = pinActivate["HAB1"]
	}

	if simMode {
		log.Printf("[SIM] pulso %dms en %s (%s) — simulado", cfg.PulseMs, cfg.Pin, cfg.ComPort)
		time.Sleep(time.Duration(cfg.PulseMs) * time.Millisecond)
		return nil
	}

	mode := &serial.Mode{BaudRate: 9600, DataBits: 8, Parity: serial.NoParity, StopBits: serial.OneStopBit}
	port, err := serial.Open(cfg.ComPort, mode)
	if err != nil {
		return err
	}
	defer port.Close()

	if _, err := port.Write([]byte{activate}); err != nil {
		return err
	}
	time.Sleep(time.Duration(cfg.PulseMs) * time.Millisecond)
	if _, err := port.Write([]byte{pinRelease}); err != nil {
		return err
	}
	return nil
}

// ── HTTP ─────────────────────────────────────────────────────

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", cfg.AllowOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func handleAbrir(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"ok": false, "error": "method not allowed"})
		return
	}
	log.Printf("[%s] solicitud apertura — modo: %s", time.Now().Format(time.RFC3339), cfg.Mode)

	if cfg.Mode == "serial" {
		if err := abrirSerial(); err != nil {
			log.Printf("[ERROR] serial: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]any{"ok": false, "error": err.Error()})
			return
		}
		log.Printf("[OK] molinete abierto (serial)")
		writeJSON(w, http.StatusOK, map[string]any{"ok": true, "mode": "serial", "pin": cfg.Pin, "comPort": cfg.ComPort})
		return
	}

	// modo proxy (default)
	forwardAbrir(w, r)
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	if cfg.Mode == "serial" {
		writeJSON(w, http.StatusOK, map[string]any{
			"ok": true, "mode": "serial", "comPort": cfg.ComPort,
			"pulseMs": cfg.PulseMs, "pin": cfg.Pin, "simulationMode": simMode,
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"ok": true, "mode": "proxy", "target": cfg.Target, "reachable": proxyReachable(),
	})
}

func main() {
	cfg = loadConfig()

	if cfg.Mode == "serial" {
		// Detectar COM; si no abre, modo simulación.
		if _, err := serial.GetPortsList(); err != nil {
			simMode = true
		} else {
			mode := &serial.Mode{BaudRate: 9600, DataBits: 8, Parity: serial.NoParity, StopBits: serial.OneStopBit}
			if p, err := serial.Open(cfg.ComPort, mode); err != nil {
				log.Printf("[WARN] no se pudo abrir %s (%v) — modo simulación activo", cfg.ComPort, err)
				simMode = true
			} else {
				p.Close()
			}
		}
	}

	http.HandleFunc("/abrir", withCORS(handleAbrir))
	http.HandleFunc("/status", withCORS(handleStatus))

	addr := ":" + strconv.Itoa(cfg.HTTPPort)
	log.Printf("\n=== MOLINETE DRIVER (Go) ===")
	log.Printf("HTTP:   http://localhost%s", addr)
	log.Printf("Modo:   %s", cfg.Mode)
	if cfg.Mode == "serial" {
		log.Printf("COM:    %s", cfg.ComPort)
		log.Printf("Pulso:  %dms", cfg.PulseMs)
		log.Printf("Pin:    %s", cfg.Pin)
		log.Printf("Sim:    %v", simMode)
	} else {
		log.Printf("Target: %s", cfg.Target)
	}
	log.Printf("============================\n")

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("[FATAL] servidor: %v", err)
	}
}
