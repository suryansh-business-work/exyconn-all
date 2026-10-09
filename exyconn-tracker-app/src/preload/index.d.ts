import type { TrackerApi } from './index';

declare global {
  interface Window {
    tracker: TrackerApi;
  }
  // The same bridge, reachable as `globalThis.tracker` in code that avoids naming `window`.
  var tracker: TrackerApi;
}

export {};
