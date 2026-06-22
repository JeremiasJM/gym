// Molinete Driver — DCM PCA150 (Go)
//
// Servicio local que controla el molinete físico via puerto serie (COM).
// DEBE correr en la PC física conectada al molinete. No corre en la nube.
//
// Protocolo PCA150: contacto seco, pulso en pin Habilitación Entrada.
//   - HAB1 -> byte 0x01 (activar) / 0x00 (liberar)
//   - HAB2 -> byte 0x02 (activar) / 0x00 (liberar)
// El pulso activa el relé; tras pulse_ms se desactiva.
package main

import (
	"encoding/json"
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
	ComPort     string `json:"com_port"`
	PulseMs     int    `json:"pulse_ms"`
	Pin         string `json:"pin"`          // HAB1 | HAB2
	AllowOrigin string `json:"allow_origin"` // origin del front (CORS), "*" permite todos
}

var pinActivate = map[string]byte{"HAB1": 0x01, "HAB2": 0x02}

const pinRelease byte = 0x00

var (
	cfg     Config
	portMu  sync.Mutex // serializa accesos al COM
	simMode bool
)

func loadConfig() Config {
	c := Config{HTTPPort: 3001, ComPort: "COM1", PulseMs: 500, Pin: "HAB1", AllowOrigin: "*"}

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
	return c
}

// abrirMolinete envía el pulso al relé de la placa.
func abrirMolinete() error {
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
	log.Printf("[%s] solicitud apertura — pin: %s, COM: %s", time.Now().Format(time.RFC3339), cfg.Pin, cfg.ComPort)

	if err := abrirMolinete(); err != nil {
		log.Printf("[ERROR] apertura: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]any{"ok": false, "error": err.Error()})
		return
	}
	log.Printf("[OK] molinete abierto")
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "pin": cfg.Pin, "comPort": cfg.ComPort, "pulseMs": cfg.PulseMs})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"ok": true, "comPort": cfg.ComPort, "pulseMs": cfg.PulseMs,
		"pin": cfg.Pin, "simulationMode": simMode,
	})
}

func main() {
	cfg = loadConfig()

	// Detectar si el COM existe; si no, modo simulación.
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

	http.HandleFunc("/abrir", withCORS(handleAbrir))
	http.HandleFunc("/status", withCORS(handleStatus))

	addr := ":" + strconv.Itoa(cfg.HTTPPort)
	log.Printf("\n=== MOLINETE DRIVER (Go) ===")
	log.Printf("HTTP:   http://localhost%s", addr)
	log.Printf("COM:    %s", cfg.ComPort)
	log.Printf("Pulso:  %dms", cfg.PulseMs)
	log.Printf("Pin:    %s", cfg.Pin)
	log.Printf("Sim:    %v", simMode)
	log.Printf("============================\n")

	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("[FATAL] servidor: %v", err)
	}
}
