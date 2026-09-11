import { AppRegistry } from 'react-native';
import { KEEP_ALIVE_TASK } from '../native/tracker-native';

let release: (() => void) | null = null;

/**
 * The headless task the Android foreground service runs for the whole session. It does nothing
 * but stay pending: while a headless task is running, React Native keeps its timers firing with
 * the app off screen — and those timers are the tracking loop.
 */
function keepAliveUntilReleased(): Promise<void> {
  return new Promise((resolve) => {
    release = resolve;
  });
}

/** Ends the task; the service stops itself once it has nothing left to run. */
export function releaseKeepAlive(): void {
  release?.();
  release = null;
}

/** Registered from the app entry, before anything renders — the service may start the task. */
export function registerKeepAliveTask(): void {
  AppRegistry.registerHeadlessTask(KEEP_ALIVE_TASK, () => keepAliveUntilReleased);
}
