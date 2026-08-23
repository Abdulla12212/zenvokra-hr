import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Where the dev server forwards `/api` and `/health`. Inside Docker Compose the API
 * is another service on the same network; on the host it is a local port.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    // Listen on all interfaces so the port is reachable from outside the container.
    host: true,
    port: 5173,
    strictPort: true,
    // Proxying keeps API calls same-origin, which means no CORS configuration and no
    // absolute URLs baked into the bundle at build time.
    proxy: {
      '/api': { target: apiProxyTarget, changeOrigin: true },
      '/health': { target: apiProxyTarget, changeOrigin: true },
    },
  },

  preview: {
    host: true,
    port: 5173,
  },

  build: {
    sourcemap: true,
  },

  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
  },
});
