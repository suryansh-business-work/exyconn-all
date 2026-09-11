import { powerMonitor } from 'electron';
import {
  TrackerEngine as CoreEngine,
  type EngineHooks,
  type TrackerSettings,
} from '@exyconn/tracker-core';
import { InputCounter } from './trackers/input-counter';
import { WindowTracker } from './trackers/window-tracker';
import { Screenshotter } from './trackers/screenshotter';
import { Outbox } from './outbox';
import * as portal from './portal-client';

export type { CaptureReport, EngineHooks } from '@exyconn/tracker-core';

/**
 * The tracking loop (`@exyconn/tracker-core`), fed by this computer: the OS idle clock, the
 * global input COUNTER, the focused window, and every display. The loop itself — intervals,
 * screenshot scheduling, the outbox and its sync cadence — is shared with the mobile app.
 */
export class TrackerEngine extends CoreEngine {
  constructor(settings: TrackerSettings, hooks: EngineHooks) {
    const screenshotter = new Screenshotter();
    super(settings, hooks, {
      portal,
      outbox: new Outbox(),
      idleSeconds: () => powerMonitor.getSystemIdleTime(),
      input: new InputCounter(),
      foreground: new WindowTracker(),
      capture: (current) => screenshotter.capture(current),
    });
  }
}
