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

  /**
   * Tenant sent on every request while there is no authentication.
   *
   * TODO(auth): delete this once the tenant comes from a signed token.
   */
  readonly VITE_DEV_TENANT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
