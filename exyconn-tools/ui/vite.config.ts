import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4001,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // esbuild (Vite's default) rather than terser: with ~13k modules terser
    // segfaults the build process, and esbuild minifies the same bundle in
    // seconds with comparable output size.
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // 'react'/'react-dom' are pulled in by the mui chunk, so listing them
          // separately produced an empty vendor chunk.
          mui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  preview: {
    port: 4001,
  },
});
