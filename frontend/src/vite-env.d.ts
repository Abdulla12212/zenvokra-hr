/// <reference types="vite/client" />

/**
 * Every environment variable the app reads, declared so that a typo is a compile
 * error rather than an `undefined` at runtime. Vite only exposes variables prefixed
 * with `VITE_`.
 */
interface ImportMetaEnv {
  /**
   * Absolute base URL of the API. Leave empty to use same-origin requests through the
   * Vite dev proxy (or through whatever serves the built assets in production).
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
