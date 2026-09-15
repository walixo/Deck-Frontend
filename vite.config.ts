import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    /* Fixed, and `strictPort` so Vite fails loudly rather than quietly taking
       the next free port — a dev server that moves is a dev server whose origin
       no longer matches the API's CLIENT_ORIGIN, and CORS then fails for a
       reason nothing on screen explains. */
    port: 3000,
    strictPort: true,
    proxy: {
      // Keeps the browser on a single origin in development — no CORS round trips.
      '/api': {
        target: 'http://localhost:4200',
        changeOrigin: true,
      },
      // Uploaded images are served by the API, but referenced as same-origin paths.
      '/uploads': {
        target: 'http://localhost:4200',
        changeOrigin: true,
      },
    },
  },
});
