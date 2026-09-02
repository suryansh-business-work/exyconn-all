import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);

/** Single source of truth for every micro-frontend's subdomain, dev port and page metadata. */
export const PORTAL_APPS = require('./apps.json');

const packageUrl = (relative) => fileURLToPath(new URL(relative, import.meta.url));

const shellSrc = packageUrl('../shell/src');
const shellPublic = packageUrl('../shell/public');
const loginSrc = packageUrl('../login/src');
const crudSrc = packageUrl('../crud/src');
const vitestSetup = packageUrl('./vitest.setup.ts');

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap';

/**
 * Injects the `<head>` every portal app shares — favicon, description, the Nunito
 * webfont and the page title — from the app registry, so the per-app `index.html`
 * stays a bare mount point and there is one place to change the shared metadata.
 */
function portalHtml(app) {
  const { title, description } = PORTAL_APPS[app];
  return {
    name: 'exyconn:portal-html',
    transformIndexHtml: {
      order: 'pre',
      handler: () => ({
        tags: [
          {
            tag: 'link',
            attrs: { rel: 'icon', type: 'image/svg+xml', href: '/exyconn-icon.svg' },
            injectTo: 'head',
          },
          { tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head' },
          {
            tag: 'link',
            attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
            injectTo: 'head',
          },
          {
            tag: 'link',
            attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
            injectTo: 'head',
          },
          { tag: 'link', attrs: { rel: 'stylesheet', href: FONT_HREF }, injectTo: 'head' },
          { tag: 'title', children: title, injectTo: 'head' },
        ],
      }),
    },
  };
}

/**
 * Vite + Vitest config shared by every portal micro-frontend, keyed by its entry in
 * the app registry. The workspace packages are consumed as source, so the aliases
 * below are what make `@exyconn/shell/...`, `@exyconn/crud/...` and the shell's own
 * internal `@/...` resolve, and `dedupe` keeps React, MUI and Apollo single instances
 * across the app and the packages.
 */
export function portalViteConfig(app) {
  const entry = PORTAL_APPS[app];
  if (!entry) {
    throw new Error(`Unknown portal app "${app}" — add it to @exyconn/config/apps.json first.`);
  }
  return {
    plugins: [react(), portalHtml(app)],
    publicDir: shellPublic,
    resolve: {
      alias: [
        { find: /^@exyconn\/shell$/, replacement: `${shellSrc}/index.ts` },
        { find: /^@exyconn\/shell\/(.*)$/, replacement: `${shellSrc}/$1` },
        { find: /^@exyconn\/crud$/, replacement: `${crudSrc}/index.ts` },
        { find: /^@exyconn\/crud\/(.*)$/, replacement: `${crudSrc}/$1` },
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
    server: { port: entry.port, strictPort: true },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: [vitestSetup],
      include: ['__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}'],
    },
  };
}
