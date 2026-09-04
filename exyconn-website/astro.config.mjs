import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite";
import node from '@astrojs/node';
import react from '@astrojs/react';
import { execSync } from 'child_process';
import pkg from './package.json' with { type: 'json' };
import { TOOLS_SITE_URL } from './src/lib/site.ts';

// Compute version at build time (not runtime)
let gitHash = 'dev';
try {
  gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
} catch {
  // Fallback for CI environments without git
  gitHash = globalThis.process?.env?.GITHUB_SHA?.slice(0, 7) || 'dev';
}
const APP_VERSION = `v${pkg.version}-${gitHash}`;

export default defineConfig({
  site: 'https://exyconn.com',
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  trailingSlash: 'never',
  redirects: {
    // The tools catalogue now lives on its own app — keep inbound links (and their SEO
    // equity) alive by sending every /tools URL to tools.exyconn.com. Tool slugs differ
    // there, so everything lands on its home page.
    '/tools': { status: 301, destination: TOOLS_SITE_URL },
    '/tools/[...slug]': { status: 301, destination: TOOLS_SITE_URL },
    // Retired Shell Strategy pages — keep inbound links alive on /ai-services.
    '/shell-strategy': { status: 301, destination: '/ai-services' },
    '/shell-strategy-terms': { status: 301, destination: '/ai-services' },
  },
  integrations: [react()],
  security: {
    // Astro only trusts the Host / X-Forwarded-* headers of these domains when it reconstructs
    // the request URL; with the list empty every request resolves to "localhost" and the
    // built-in cross-site check rejects the editor's login form. Local hosts cover `pnpm dev`.
    allowedDomains: [
      { hostname: 'exyconn.com' },
      { hostname: 'www.exyconn.com' },
      // The TinaCMS editor is served on its own host; without it here the login form's
      // cross-site check rejects every sign-in attempt against that domain.
      { hostname: 'tina-cms.exyconn.com' },
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
    ],
  },
  markdown: {
    // Blog and case-study bodies are markdown edited in TinaCMS; keep the straight quotes and
    // apostrophes editors type rather than converting them to typographic ones.
    smartypants: false,
  },
  server: {
    host: true, // allows 0.0.0.0 binding
    port: 4000  // exyconn.com website port
  },
  i18n: {
    locales: ["es", "en", "fr"],
    defaultLocale: "en",
  },
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_APP_VERSION': JSON.stringify(APP_VERSION),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import './src/styles/global.scss';`
      }
    }
  }
})
