/**
 * Configuracion central de variables de entorno.
 *
 * Todas las envs del frontend deben leerse desde aca (no usar
 * `import.meta.env` directamente en los componentes/servicios).
 *
 * En Cloudflare Pages, estas variables se definen en:
 *   Settings -> Environment variables (build)
 */

/** URL base del backend, ej: https://api.cefide.com (sin slash final). */
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/**
 * URL del driver local del molinete (corre en la MISMA PC que el navegador).
 * `localhost` está exento del bloqueo mixed-content, por eso un front HTTPS
 * puede llamarlo. Cada PC abre solo su propio molinete.
 */
const DRIVER_URL = (import.meta.env.VITE_DRIVER_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export const config = {
  /** Endpoint base del API (incluye el prefijo `/api`). */
  apiBase: `${API_URL}/api`,
  /** Base del driver local del molinete. */
  driverBase: DRIVER_URL,
} as const;
