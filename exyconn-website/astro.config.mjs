import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite";
import node from '@astrojs/node';
import react from '@astrojs/react';
import { execSync } from 'child_process';
import pkg from './package.json' with { type: 'json' };

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
  integrations: [react()],
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
