import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

/**
 * Native modules (uiohook-napi, get-windows) must stay external — bundling their
 * prebuilt .node/child-process binaries would break them. externalizeDepsPlugin
 * keeps every dependency external in the main/preload builds.
 */
const sharedAlias = { '@shared': resolve(__dirname, 'src/shared') };

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: sharedAlias },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: sharedAlias },
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()],
    resolve: {
      alias: sharedAlias,
      // @exyconn/ui is a linked workspace package that Vite compiles from source, so it
      // resolves React, emotion and MUI from ITS OWN node_modules. Two copies of React in
      // one renderer means hooks called against a context that does not exist — dedupe
      // pins every shared runtime to this app's copy.
      dedupe: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
    },
    // The tracker's dev renderer owns port 4005 (main process picks it up via
    // ELECTRON_RENDERER_URL). strictPort so a silent fallback can't shift it.
    server: { port: 4005, strictPort: true },
    build: {
      rollupOptions: {
        // TWO renderer entries: the tracker window, and the screenshot gallery that opens in a
        // separate BrowserWindow. Without the second input, screenshots.html is never emitted
        // and the gallery window loads a blank page in the packaged app.
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          screenshots: resolve(__dirname, 'src/renderer/screenshots.html'),
        },
      },
    },
  },
});
