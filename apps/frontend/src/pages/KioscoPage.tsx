import { useState, useEffect, useRef, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

type Estado = 'idle' | 'loading_consultar' | 'seleccion' | 'loading_validar' | 'VERDE' | 'AMARILLO' | 'ROJO' | 'error';

interface Inscripcion {
  id: string;
  actividad: string;
  clasesRestantes: number;
  pagado: boolean;
}

interface ConsultaResult {
  alumno: { id: string; nombre: string; apellido: string; dni: string };
  activo: boolean;
  esComodin: boolean;
  inscripciones: Inscripcion[];
}

interface AccesoResult {
  estado: 'VERDE' | 'AMARILLO' | 'ROJO';
  alumno: { nombre: string; apellido: string; dni: string };
  clasesRestantes: number;
  clasesGraciaRestantes: number;
  mensaje: string;
  actividad?: string;
}

const FEEDBACK_TIMEOUT = 3500;

function getMolineteFromUrl(): number {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('molinete') || '1', 10);
}

export function KioscoPage() {
  const [dni, setDni] = useState('');
  const [estado, setEstado] = useState<Estado>('idle');
  const [consulta, setConsulta] = useState<ConsultaResult | null>(null);
  const [resultado, setResultado] = useState<AccesoResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const molinete = useRef(getMolineteFromUrl());

  const reset = useCallback(() => {
    setDni('');
    setEstado('idle');
    setConsulta(null);
    setResultado(null);
    setErrorMsg('');
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const feedbackStates: Estado[] = ['VERDE', 'AMARILLO', 'ROJO', 'error'];
    if (feedbackStates.includes(estado)) {
      timeoutRef.current = setTimeout(reset, FEEDBACK_TIMEOUT);
      return () => clearTimeout(timeoutRef.current);
    }
  }, [estado, reset]);

  useEffect(() => {
    inputRef.current?.focus();
    function handleClick() { inputRef.current?.focus(); }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  async function handleConsultar() {
    const trimmed = dni.trim();
    if (!trimmed || trimmed.length < 7) return;

    setEstado('loading_consultar');

    try {
      const res = await api<ConsultaResult>('/acceso/consultar', {
        method: 'POST',
        body: JSON.stringify({ dni: trimmed }),
      });

      if (!res.activo) {
        setErrorMsg('Alumno inactivo — acceso bloqueado');
        setEstado('error');
        return;
      }

      if (res.esComodin) {
        await handleValidar(trimmed, null);
        return;
      }

      if (res.inscripciones.length === 0) {
        setErrorMsg('Sin actividades registradas');
        setEstado('error');
        return;
      }

      if (res.inscripciones.length === 1) {
        setConsulta(res);
        await handleValidar(trimmed, res.inscripciones[0].id);
        return;
      }

      setConsulta(res);
      setEstado('seleccion');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setErrorMsg('DNI no registrado');
      } else {
        setErrorMsg('Error de conexión');
      }
      setEstado('error');
    }
  }

  async function handleValidar(dniVal: string, inscripcionId: string | null) {
    setEstado('loading_validar');

    try {
      const res = await api<AccesoResult>('/acceso/validar', {
        method: 'POST',
        body: JSON.stringify({ dni: dniVal, inscripcionId, molinete: molinete.current }),
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
    if (e.key === 'Enter') handleConsultar();
  }

  const bgClass = {
    idle: 'bg-cefide-bg',
    loading_consultar: 'bg-cefide-bg',
    seleccion: 'bg-cefide-bg',
    loading_validar: 'bg-cefide-bg',
    VERDE: 'bg-cefide-success',
    AMARILLO: 'bg-cefide-warning',
    ROJO: 'bg-cefide-accent-alt',
    error: 'bg-cefide-accent-alt',
  }[estado];

  const textClass =
    estado === 'idle' || estado === 'loading_consultar' || estado === 'seleccion' || estado === 'loading_validar'
      ? 'text-cefide-text'
      : 'text-black';

  const isLoading = estado === 'loading_consultar' || estado === 'loading_validar';
  const isIdle = estado === 'idle';

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-300 ${bgClass} select-none`}
    >
      {/* IDLE / LOADING — Input screen */}
      {(isIdle || isLoading) && (
        <div className="text-center space-y-8 w-full max-w-lg px-8">
          <div>
            <h1 className="text-5xl font-bold text-cefide-accent tracking-wider">CEFIDE</h1>
            <p className="text-xl text-cefide-muted mt-2">Ingrese su DNI</p>
          </div>

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={dni}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 8) setDni(val);
            }}
            onKeyDown={handleKeyDown}
            placeholder="• • • • • • • •"
            autoFocus
            autoComplete="off"
            className="w-full text-center text-5xl font-mono tracking-[0.3em] bg-cefide-surface border-2 border-cefide-border rounded-xl py-6 px-4 text-cefide-text placeholder:text-cefide-border focus:outline-none focus:border-cefide-accent transition-colors"
            disabled={isLoading}
          />

          {isLoading && (
            <p className="text-xl text-cefide-muted animate-pulse">Validando...</p>
          )}

          {!isLoading && (
            <p className="text-sm text-cefide-border">Presione ENTER para confirmar</p>
          )}
        </div>
      )}

      {/* SELECCION — Choose activity */}
      {estado === 'seleccion' && consulta && (
        <div className="text-center space-y-6 w-full max-w-lg px-8">
          <div>
            <h2 className="text-3xl font-bold">
              {consulta.alumno.apellido}, {consulta.alumno.nombre}
            </h2>
            <p className="text-xl text-cefide-muted mt-2">¿A qué actividad venís hoy?</p>
          </div>

          <div className="space-y-3">
            {consulta.inscripciones.map((ins) => (
              <button
                key={ins.id}
                onClick={() => handleValidar(consulta.alumno.dni, ins.id)}
                className="w-full py-4 px-6 rounded-xl border-2 border-cefide-border bg-cefide-surface hover:border-cefide-accent hover:bg-cefide-accent/10 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{ins.actividad}</span>
                  <span className="text-lg text-cefide-muted">
                    {ins.clasesRestantes} clase{ins.clasesRestantes !== 1 ? 's' : ''}
                  </span>
                </div>
                {!ins.pagado && (
                  <p className="text-sm text-cefide-warning mt-1">⚠ Pago pendiente</p>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={reset}
            className="text-sm text-cefide-muted hover:text-cefide-text transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* VERDE */}
      {estado === 'VERDE' && resultado && (
        <div className={`text-center space-y-6 ${textClass}`}>
          <div className="text-8xl font-bold">✓</div>
          <h2 className="text-5xl font-bold">
            {resultado.alumno.nombre} {resultado.alumno.apellido}
          </h2>
          {resultado.actividad && (
            <p className="text-2xl font-semibold">{resultado.actividad}</p>
          )}
          <p className="text-3xl font-semibold">
            {resultado.clasesRestantes} clase{resultado.clasesRestantes !== 1 ? 's' : ''} restante{resultado.clasesRestantes !== 1 ? 's' : ''}
          </p>
          <p className="text-xl opacity-80">ACCESO PERMITIDO</p>
        </div>
      )}

      {/* AMARILLO */}
      {estado === 'AMARILLO' && resultado && (
        <div className={`text-center space-y-6 ${textClass}`}>
          <div className="text-8xl font-bold">⚠</div>
          <h2 className="text-5xl font-bold">
            {resultado.alumno.nombre} {resultado.alumno.apellido}
          </h2>
          {resultado.actividad && (
            <p className="text-2xl font-semibold">{resultado.actividad}</p>
          )}
          <p className="text-3xl font-semibold">
            {resultado.clasesGraciaRestantes} clase{resultado.clasesGraciaRestantes !== 1 ? 's' : ''} de gracia
          </p>
          <p className="text-2xl font-bold">REGULARIZAR PAGO</p>
          <p className="text-xl opacity-80">ACCESO CON GRACIA</p>
        </div>
      )}

      {/* ROJO */}
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

      {/* ERROR */}
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
