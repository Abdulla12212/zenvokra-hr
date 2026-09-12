/**
 * Single place that reads `import.meta.env`, so nothing else has to know which
 * variables exist or handle their absence.
 */
export const env = {
  /**
   * Prefix for API requests. Empty means same-origin, which is what the Vite dev
   * proxy and a reverse proxy in front of the built assets both provide.
   */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, ''),

  isDevelopment: import.meta.env.DEV,
} as const;
