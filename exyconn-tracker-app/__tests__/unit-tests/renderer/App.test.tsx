// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackerState } from '@shared/types';
import App from '../../../src/renderer/App';
import {
  installDomShims,
  installTracker,
  overrideTracker,
  render,
  settle,
  trackerState,
  unmountAll,
} from '../test-utils';

/** The ground opacity App hands its frame on each render. */
const { frames } = vi.hoisted(() => ({ frames: [] as number[] }));

vi.mock('../../../src/renderer/components/AppFrame', () => ({
  default: ({
    children,
    groundOpacity,
  }: Readonly<{ children: ReactNode; groundOpacity?: number }>) => {
    frames.push(groundOpacity ?? 1);
    return <div>{children}</div>;
  },
}));

/** A state whose employee has asked for a see-through window at 60%. */
function seeThroughState(): TrackerState {
  const state = trackerState('idle');
  return {
    ...state,
    preferences: { ...state.preferences, transparentBackground: true, backgroundOpacity: 0.6 },
  };
}

/** Puts the OS's answer about transparency in front of the fixture bridge. */
function supportTransparency(): void {
  const base = window.tracker;
  const api = new Proxy(base, {
    get: (target, name: string) =>
      name === 'transparencySupported' ? true : target[name as keyof typeof target],
  });
  Object.defineProperty(globalThis, 'tracker', { value: api, configurable: true, writable: true });
}

beforeAll(installDomShims);

beforeEach(() => {
  frames.length = 0;
});

afterEach(unmountAll);

describe('App', { timeout: 30_000 }, () => {
  it('shows a labelled spinner on a solid ground until the first state lands', async () => {
    installTracker(trackerState('idle'));
    overrideTracker({ getState: () => new Promise<never>(() => undefined) });

    await render(<App />);
    await settle();

    expect(document.querySelector('[role="progressbar"][aria-label="Loading…"]')).not.toBeNull();
    expect(document.querySelector('main')).toBeNull();
    expect(frames.at(-1)).toBe(1);
  });

  it('thins the ground to the chosen opacity where the OS can frost the window', async () => {
    installTracker(seeThroughState());
    supportTransparency();

    await render(<App />);
    await settle();

    expect(document.querySelector('main')).not.toBeNull();
    expect(frames.at(-1)).toBe(0.6);
  });

  it('keeps the ground solid where the OS cannot, whatever the preference says', async () => {
    installTracker(seeThroughState());

    await render(<App />);
    await settle();

    expect(document.querySelector('main')).not.toBeNull();
    expect(frames.at(-1)).toBe(1);
  });
});
