/// <reference types="electron-vite/node" />

/**
 * electron-vite rewrites a `?asset` import into the emitted file's path on disk, so the main
 * process can hand it to nativeImage/Tray in both dev and a packaged build.
 */
declare module '*?asset' {
  const path: string;
  export default path;
}
