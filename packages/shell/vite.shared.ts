import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';

const shellSrc = fileURLToPath(new URL('./src', import.meta.url));
const shellPublic = fileURLToPath(new URL('./public', import.meta.url));
const loginSrc = fileURLToPath(new URL('../login/src', import.meta.url));

/**
 * Vite config shared by every portal micro-frontend. The packages are consumed
 * as source, so the aliases below are what make `@exyconn/shell/...` (and the
 * shell's own internal `@/...`) resolve, and `dedupe` keeps React, MUI and
 * Apollo as single instances across the app and the packages.
 */
export function portalViteConfig(port: number): UserConfig {
  return {
    plugins: [react()],
    publicDir: shellPublic,
    resolve: {
      alias: [
        { find: /^@exyconn\/shell$/, replacement: `${shellSrc}/index.ts` },
        { find: /^@exyconn\/shell\/(.*)$/, replacement: `${shellSrc}/$1` },
        { find: /^@exyconn\/login$/, replacement: `${loginSrc}/index.ts` },
        { find: /^@\/(.*)$/, replacement: `${shellSrc}/$1` },
      ],
      dedupe: [
        'react',
        'react-dom',
        'react-router-dom',
        '@apollo/client',
        '@emotion/react',
        '@emotion/styled',
        '@mui/material',
        '@mui/system',
      ],
    },
    server: { port, strictPort: true },
  };
}
