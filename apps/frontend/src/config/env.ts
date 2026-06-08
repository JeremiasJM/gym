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

export const config = {
  /** Endpoint base del API (incluye el prefijo `/api`). */
  apiBase: `${API_URL}/api`,
} as const;
