import { useState, useEffect, useRef, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

type Estado = 'idle' | 'loading' | 'VERDE' | 'AMARILLO' | 'ROJO' | 'error';

interface AccesoResult {
  estado: 'VERDE' | 'AMARILLO' | 'ROJO';
  alumno: {
    nombre: string;
    apellido: string;
    dni: string;
  };
  clasesRestantes: number;
  clasesGraciaRestantes: number;
  mensaje: string;
}

const FEEDBACK_TIMEOUT = 3000;

// Molinete se puede configurar via query param: /kiosco?molinete=2
function getMolineteFromUrl(): number {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('molinete') || '1', 10);
}

export function KioscoPage() {
  const [dni, setDni] = useState('');
  const [estado, setEstado] = useState<Estado>('idle');
  const [resultado, setResultado] = useState<AccesoResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const molinete = useRef(getMolineteFromUrl());

  const reset = useCallback(() => {
    setDni('');
    setEstado('idle');
    setResultado(null);
    setErrorMsg('');
    inputRef.current?.focus();
  }, []);

  // Auto-reset after feedback
  useEffect(() => {
    if (estado === 'VERDE' || estado === 'AMARILLO' || estado === 'ROJO' || estado === 'error') {
      timeoutRef.current = setTimeout(reset, FEEDBACK_TIMEOUT);
      return () => clearTimeout(timeoutRef.current);
    }
  }, [estado, reset]);

  // Keep focus on input always
  useEffect(() => {
    inputRef.current?.focus();

    function handleClick() {
      inputRef.current?.focus();
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  async function handleSubmit() {
    const trimmed = dni.trim();
    if (!trimmed || trimmed.length < 7) return;

    setEstado('loading');

    try {
      const res = await api<AccesoResult>('/acceso/validar', {
        method: 'POST',
        body: JSON.stringify({ dni: trimmed, molinete: molinete.current }),
      });
      setResultado(res);
      setEstado(res.estado);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setErrorMsg('DNI no registrado');
      } else {
        setErrorMsg('Error de conexión');
      }
      setEstado('error');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  // Background color based on state
  const bgClass = {
    idle: 'bg-cefide-bg',
    loading: 'bg-cefide-bg',
    VERDE: 'bg-cefide-success',
    AMARILLO: 'bg-cefide-warning',
    ROJO: 'bg-cefide-accent-alt',
    error: 'bg-cefide-accent-alt',
  }[estado];

  // Text color on colored backgrounds
  const textClass =
    estado === 'idle' || estado === 'loading'
      ? 'text-cefide-text'
      : 'text-black';

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${bgClass} select-none`}
    >
      {/* IDLE / LOADING — Input screen */}
      {(estado === 'idle' || estado === 'loading') && (
        <div className="text-center space-y-8 w-full max-w-lg px-8">
          <div>
            <h1 className="text-5xl font-bold text-cefide-accent tracking-wider">
              CEFIDE
            </h1>
            <p className="text-xl text-cefide-muted mt-2">
              Ingrese su DNI
            </p>
          </div>

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={dni}
            onChange={(e) => {
              // Solo números
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 8) setDni(val);
            }}
            onKeyDown={handleKeyDown}
            placeholder="• • • • • • • •"
            autoFocus
            autoComplete="off"
            className="w-full text-center text-5xl font-mono tracking-[0.3em] bg-cefide-surface border-2 border-cefide-border rounded-xl py-6 px-4 text-cefide-text placeholder:text-cefide-border focus:outline-none focus:border-cefide-accent transition-colors"
            disabled={estado === 'loading'}
          />

          {estado === 'loading' && (
            <p className="text-xl text-cefide-muted animate-pulse">
              Validando...
            </p>
          )}

          <p className="text-sm text-cefide-border">
            Presione ENTER para confirmar
          </p>
        </div>
      )}

      {/* VERDE — Access granted */}
      {estado === 'VERDE' && resultado && (
        <div className={`text-center space-y-6 ${textClass}`}>
          <div className="text-8xl font-bold">✓</div>
          <h2 className="text-5xl font-bold">
            {resultado.alumno.nombre} {resultado.alumno.apellido}
          </h2>
          <p className="text-3xl font-semibold">
            {resultado.clasesRestantes} clase{resultado.clasesRestantes !== 1 ? 's' : ''} restante{resultado.clasesRestantes !== 1 ? 's' : ''}
          </p>
          <p className="text-xl opacity-80">ACCESO PERMITIDO</p>
        </div>
      )}

      {/* AMARILLO — Grace access */}
      {estado === 'AMARILLO' && resultado && (
        <div className={`text-center space-y-6 ${textClass}`}>
          <div className="text-8xl font-bold">⚠</div>
          <h2 className="text-5xl font-bold">
            {resultado.alumno.nombre} {resultado.alumno.apellido}
          </h2>
          <p className="text-3xl font-semibold">
            {resultado.clasesGraciaRestantes} clase{resultado.clasesGraciaRestantes !== 1 ? 's' : ''} de gracia
          </p>
          <p className="text-2xl font-bold">REGULARIZAR PAGO</p>
          <p className="text-xl opacity-80">ACCESO CON GRACIA</p>
        </div>
      )}

      {/* ROJO — Access denied */}
      {estado === 'ROJO' && resultado && (
        <div className={`text-center space-y-6 ${textClass}`}>
          <div className="text-8xl font-bold">✕</div>
          <h2 className="text-5xl font-bold">
            {resultado.alumno.nombre} {resultado.alumno.apellido}
          </h2>
          <p className="text-3xl font-semibold">ACCESO BLOQUEADO</p>
          <p className="text-xl opacity-80">{resultado.mensaje}</p>
        </div>
      )}

      {/* ERROR — DNI not found or connection error */}
      {estado === 'error' && (
        <div className={`text-center space-y-6 ${textClass}`}>
          <div className="text-8xl font-bold">✕</div>
          <p className="text-4xl font-bold">{errorMsg}</p>
          <p className="text-xl opacity-80">ACCESO DENEGADO</p>
        </div>
      )}
    </div>
  );
}
