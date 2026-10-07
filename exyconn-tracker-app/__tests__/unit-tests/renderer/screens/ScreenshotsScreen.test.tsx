// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { DayDetail } from '@shared/types';
import ScreenshotsScreen from '../../../../src/renderer/screens/ScreenshotsScreen';
import {
  clickElement,
  deferred,
  flush,
  installDomShims,
  render,
  stubTracker,
  unmountAll,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

const START = '2026-09-14T00:00:00.000Z';
const END = '2026-09-15T00:00:00.000Z';

function detail(count: number): DayDetail {
  const screenshots = Array.from({ length: count }, (_unused, index) => ({
    id: `shot-${index}`,
    capturedAt: `2026-09-14T0${index + 1}:00:00.000Z`,
    imageUrl: 'data:,',
    blurred: false,
    activityPercent: 60,
  }));
  return {
    activeMs: 0,
    idleMs: 0,
    keyCount: 0,
    mouseCount: 0,
    sessions: 1,
    screenshots,
    intervals: [],
  };
}

async function open(getDay: () => Promise<DayDetail>): Promise<void> {
  stubTracker({ getDay });
  await render(<ScreenshotsScreen startISO={START} endISO={END} timezone="UTC" />);
}

function openButtons(): HTMLButtonElement[] {
  return [
    ...document.querySelectorAll<HTMLButtonElement>('main [aria-label^="Open the screenshot"]'),
  ];
}

describe('ScreenshotsScreen', () => {
  it('holds the grid as placeholders while the day loads, and names the day and zone', async () => {
    const day = deferred<DayDetail>();
    const getDay = vi.fn(() => day.promise);
    await open(getDay);
    expect(getDay).toHaveBeenCalledWith(START, END);
    expect(document.querySelector('h1')?.textContent).toBe('My screenshots');
    expect(document.body.textContent).toContain('times shown in UTC');
    expect(document.querySelectorAll('.MuiSkeleton-rounded')).toHaveLength(6);
    expect(document.body.textContent).not.toContain('No screenshots were captured');

    day.resolve(detail(3));
    await flush();
    expect(document.querySelectorAll('.MuiSkeleton-rounded')).toHaveLength(0);
    expect(document.body.textContent).toContain('3 captured');
    expect(openButtons()).toHaveLength(3);
  });

  it('opens a shot full screen, and closes it again', async () => {
    await open(() => Promise.resolve(detail(2)));
    await flush();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await clickElement(openButtons()[1]);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    const close = document.querySelector<HTMLElement>('[role="dialog"] [aria-label="Close"]');
    if (close === null) {
      throw new Error('No close button');
    }
    await clickElement(close);
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
  });

  it('says so when nothing was captured that day', async () => {
    await open(() => Promise.resolve(detail(0)));
    await flush();
    expect(document.body.textContent).toContain('No screenshots were captured on this day.');
    expect(openButtons()).toHaveLength(0);
  });

  it('explains a day that could not be read, instead of calling it empty', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await open(() => Promise.reject(new Error('Offline')));
    await flush();
    expect(document.querySelector('.MuiAlert-colorError')?.textContent).toBe(
      'Could not load this day. Check your connection and try again.',
    );
    expect(document.querySelectorAll('.MuiSkeleton-rounded')).toHaveLength(0);
    expect(document.body.textContent).not.toContain('No screenshots were captured');
  });
});
