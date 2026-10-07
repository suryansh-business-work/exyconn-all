// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useCaptureNotification from '../../../../src/renderer/hooks/useCaptureNotification';
import { flush, render, rerender, stubTracker, unmountAll } from '../../test-utils';

function Probe({ timezone }: Readonly<{ timezone: string }>): ReactElement {
  useCaptureNotification(timezone);
  return <span />;
}

type Listener = (capturedAt: string) => void;

let listener: Listener = () => undefined;
const unsubscribe = vi.fn();
const openScreenshots = vi.fn(() => Promise.resolve());

function install(): void {
  stubTracker({
    onOpenCaptureDay: (next: Listener) => {
      listener = next;
      return unsubscribe;
    },
    openScreenshots,
  });
}

async function notify(capturedAt: string): Promise<void> {
  act(() => listener(capturedAt));
  await flush();
}

afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
  unsubscribe.mockClear();
  openScreenshots.mockReset();
  openScreenshots.mockImplementation(() => Promise.resolve());
});

describe('useCaptureNotification', () => {
  it('opens the gallery on the day the shot was taken, in the employee’s zone', async () => {
    install();
    await render(<Probe timezone="Asia/Kolkata" />);
    // 00:30 in Kolkata on the 14th — still the 13th in UTC.
    await notify('2026-09-13T19:00:00.000Z');
    expect(openScreenshots).toHaveBeenCalledWith({
      startISO: '2026-09-13T18:30:00.000Z',
      endISO: '2026-09-14T18:30:00.000Z',
    });
  });

  it('declines an instant it cannot read rather than open an empty gallery', async () => {
    install();
    await render(<Probe timezone="UTC" />);
    await notify('not a date');
    expect(openScreenshots).not.toHaveBeenCalled();
  });

  it('logs, never throws, when the gallery cannot be opened', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    openScreenshots.mockImplementation(() => Promise.reject(new Error('No window')));
    install();
    await render(<Probe timezone="UTC" />);
    await notify('2026-09-14T10:00:00.000Z');
    expect(log).toHaveBeenCalledWith('Tracker action failed', expect.any(Error));
  });

  it('re-subscribes when the zone changes, and lets go on unmount', async () => {
    install();
    await render(<Probe timezone="UTC" />);
    await rerender(<Probe timezone="Europe/London" />);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    await notify('2026-09-14T10:00:00.000Z');
    expect(openScreenshots).toHaveBeenCalledWith({
      startISO: '2026-09-13T23:00:00.000Z',
      endISO: '2026-09-14T23:00:00.000Z',
    });
    unmountAll();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });
});
