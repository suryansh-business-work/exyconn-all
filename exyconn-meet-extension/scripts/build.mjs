/**
 * Builds the extension into dist/chrome-meeting-assistant/ (manifest.json at its root).
 *
 *   node scripts/build.mjs --mode production [--watch]
 *
 * Three Vite builds: the extension pages and the module service worker; the content script
 * as ONE classic IIFE (content scripts cannot be ES modules); and the PCM AudioWorklet. Endpoints come from
 * scripts/modes.json through `define`; nothing remote is loaded at runtime.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import react from '@vitejs/plugin-react';
import { build } from 'vite';
import { BUILD_VERSION, BUILD_VERSION_NAME, defineConstants, modeConfig } from './lib/defines.mjs';
import { ICON_SIZES, buildManifest } from './lib/manifest.mjs';
import { BUILD_INFO, OUT_DIR, SRC_DIR, UI_SRC } from './lib/paths.mjs';
import { renderIcon } from './lib/png.mjs';

const { values } = parseArgs({
  options: {
    mode: { type: 'string', default: 'production' },
    watch: { type: 'boolean', default: false },
  },
});
const mode = values.mode;
const { apiUrl } = modeConfig(mode);
const development = mode === 'development';
const nodeEnv = development ? 'development' : 'production';

const shared = {
  configFile: false,
  root: SRC_DIR,
  mode: nodeEnv,
  logLevel: 'warn',
  plugins: [react()],
  define: { ...defineConstants(mode), 'process.env.NODE_ENV': JSON.stringify(nodeEnv) },
  resolve: {
    alias: [
      { find: /^@exyconn\/ui$/, replacement: `${UI_SRC}/index.ts` },
      { find: /^@exyconn\/ui\/(.*)$/, replacement: `${UI_SRC}/$1` },
    ],
  },
};

const output = {
  outDir: OUT_DIR,
  target: 'chrome116',
  sourcemap: development,
  minify: !development,
  watch: values.watch ? {} : null,
};

rmSync(OUT_DIR, { recursive: true, force: true });

await build({
  ...shared,
  build: {
    ...output,
    emptyOutDir: false,
    modulePreload: { polyfill: false },
    rolldownOptions: {
      input: {
        popup: join(SRC_DIR, 'popup.html'),
        options: join(SRC_DIR, 'options.html'),
        offscreen: join(SRC_DIR, 'offscreen.html'),
        background: join(SRC_DIR, 'background/index.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});

await build({
  ...shared,
  build: {
    ...output,
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry: join(SRC_DIR, 'content/index.tsx'),
      formats: ['iife'],
      name: 'ExyconnMeetingAssistant',
      fileName: () => 'content.js',
    },
  },
});

// The AudioWorklet: its own packaged file, loaded by URL (no inline or blob code under CSP).
await build({
  ...shared,
  build: {
    ...output,
    emptyOutDir: false,
    copyPublicDir: false,
    lib: {
      entry: join(SRC_DIR, 'offscreen/pcm-worklet.ts'),
      formats: ['es'],
      fileName: () => 'pcm-worklet.js',
    },
  },
});

mkdirSync(join(OUT_DIR, 'icons'), { recursive: true });
for (const size of ICON_SIZES) {
  writeFileSync(join(OUT_DIR, 'icons', `icon-${size}.png`), renderIcon(size));
}

const key = process.env.MEET_EXTENSION_PUBLIC_KEY?.trim() || undefined;
const manifest = buildManifest({
  version: BUILD_VERSION,
  versionName: BUILD_VERSION_NAME,
  apiUrl,
  key,
});
writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(BUILD_INFO, `${JSON.stringify({ mode, version: BUILD_VERSION }, null, 2)}\n`);

console.log(`Built Exyconn Meeting Assistant ${BUILD_VERSION} (${mode}) into ${OUT_DIR}`);
