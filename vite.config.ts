/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` genera rutas relativas: el build funciona en cualquier hosting
// estático (Vercel, Netlify, GitHub Pages en un subdirectorio, etc.).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      // Separa las librerías en chunks propios para aprovechar la caché del navegador.
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'node',
  },
});
