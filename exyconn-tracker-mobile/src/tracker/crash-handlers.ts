import { captureConsole } from '@exyconn/logger';
import { logger } from './logger';
import { markFatal, startSessionMarker } from './session-marker';

interface HermesInternal {
  enablePromiseRejectionTracker?: (options: {
    allRejections: boolean;
    onUnhandled: (id: number, rejection: unknown) => void;
  }) => void;
}

/**
 * Release builds drop unhandled promise rejections silently; dev builds already print them
 * (and the console capture forwards those).
 */
function trackPromiseRejections(): void {
  if (__DEV__) {
    return;
  }
  const hermes = (globalThis as { HermesInternal?: HermesInternal }).HermesInternal;
  hermes?.enablePromiseRejectionTracker?.({
    allRejections: true,
    onUnhandled: (_id, rejection) =>
      logger.capture(rejection, { context: { kind: 'unhandledrejection' } }),
  });
}

/**
 * Sends every error the phone app hits to Tech > Logs: uncaught JS errors (fatal ones close the
 * app — they are on disk before React Native's own handler runs), unhandled rejections, every
 * `console.error`/`warn`, and the crashes JS never sees (see session-marker.ts). Screen render
 * errors are caught per route by `ScreenErrorBoundary` and never reach here.
 */
export function installCrashHandlers(): void {
  captureConsole(logger);
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    if (isFatal) {
      markFatal();
    }
    logger.capture(error, { context: { fatal: isFatal === true } });
    previous(error, isFatal);
  });
  trackPromiseRejections();
  startSessionMarker(logger);
  logger.info('App started');
}
