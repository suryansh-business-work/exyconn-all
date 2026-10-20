import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { defineConstants } from './scripts/lib/defines.mjs';

const uiSrc = fileURLToPath(new URL('../packages/ui/src', import.meta.url));

/**
 * Only the Cypress component dev server reads this file. The extension itself is built by
 * scripts/build.mjs, which drives Vite's JS API once per entry.
 */
export default defineConfig({
  plugins: [react()],
  define: defineConstants('development'),
  resolve: {
    alias: [
      { find: /^@exyconn\/ui$/, replacement: `${uiSrc}/index.ts` },
      { find: /^@exyconn\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
    ],
  },
});
