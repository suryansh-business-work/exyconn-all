// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CaptureAnnouncement } from '@shared/types';
import useShutterSound from '../../../../src/renderer/hooks/useShutterSound';
import { playShutter } from '../../../../src/renderer/shutter';
import { render, stubTracker, unmountAll } from '../../test-utils';

vi.mock('../../../../src/renderer/shutter', () => ({ playShutter: vi.fn() }));

function Probe(): ReactElement {
  useShutterSound();
  return <span />;
}

type Listener = (capture: CaptureAnnouncement) => void;

let listener: Listener = () => undefined;
const unsubscribe = vi.fn();

function install(): void {
  stubTracker({
    onScreenshotCaptured: (next: Listener) => {
      listener = next;
      return unsubscribe;
    },
  });
}

afterEach(() => {
  unmountAll();
  vi.mocked(playShutter).mockClear();
  unsubscribe.mockClear();
});

describe('useShutterSound', () => {
  it('fires the shutter for every audible capture', async () => {
    install();
    await render(<Probe />);
    act(() => listener({ count: 2, capturedAt: '2026-09-14T10:00:00.000Z', silent: false }));
    act(() => listener({ count: 1, capturedAt: '2026-09-14T10:10:00.000Z', silent: false }));
    expect(playShutter).toHaveBeenCalledTimes(2);
  });

  it('stays quiet for a capture main announced as silent', async () => {
    install();
    await render(<Probe />);
    act(() => listener({ count: 1, capturedAt: '2026-09-14T10:00:00.000Z', silent: true }));
    expect(playShutter).not.toHaveBeenCalled();
  });

  it('stops listening once unmounted', async () => {
    install();
    await render(<Probe />);
    expect(unsubscribe).not.toHaveBeenCalled();
    unmountAll();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
