/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base del backend, ej: https://api.cefide.com */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
