import { vi } from 'vitest';
import type {
  CaptureReport,
  ComposeInput,
  EngineHooks,
  TrackerSettings,
} from '@exyconn/tracker-core';
import type { PlatformContext } from '../../../src/tracker/platform/shared';
import type { MobileTrackerState } from '../../../src/tracker/types';
import { settings } from '../dashboard/fixtures';

/** What instance.ts hands the controller — the parts these tests drive. */
export interface ControllerDepsSeen {
  createEngine: (settings: TrackerSettings, hooks: EngineHooks) => unknown;
  onChange: (state: MobileTrackerState) => void;
  onCapture: (report: CaptureReport) => void;
  composeWithWebcam: (input: ComposeInput) => Promise<string | null>;
  portal: unknown;
  notifier: unknown;
  permissions: unknown;
}

/** Shared between the hoisted mocks and the tests of one file. */
export function createHarness() {
  return {
    deps: null as ControllerDepsSeen | null,
    context: null as PlatformContext | null,
    engineArgs: [] as unknown[][],
    controller: {
      pause: vi.fn(),
      resume: vi.fn(),
      refreshPermissions: vi.fn(),
      getState: vi.fn(),
      requestPermission: vi.fn(),
      restore: vi.fn(),
    },
  };
}

export type Harness = ReturnType<typeof createHarness>;

/** A published tracker state, holding only what instance.ts reads. */
export function stateOf(
  status: MobileTrackerState['status'],
  overrides: { settings?: TrackerSettings | null; muted?: boolean } = {},
): MobileTrackerState {
  const partial = {
    status,
    settings: overrides.settings === undefined ? settings() : overrides.settings,
    preferences: { muteCaptureSound: overrides.muted ?? false },
  };
  return partial as unknown as MobileTrackerState;
}

export function depsOf(harness: Harness): ControllerDepsSeen {
  if (harness.deps === null) {
    throw new Error('The controller was not created at import.');
  }
  return harness.deps;
}
