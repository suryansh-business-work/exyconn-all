import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveStats } from '@shared/types';

const { center, FakeNotification, lastShown, resetCenter } = await vi.hoisted(
  () => import('./notification-fake'),
);
const { createFromBuffer, heroToastXml } = vi.hoisted(() => ({
  createFromBuffer: vi.fn(),
  heroToastXml: vi.fn(() => '<toast/>'),
}));

vi.mock('electron', () => ({
  Notification: FakeNotification,
  nativeImage: { createFromBuffer },
}));
vi.mock('../../../src/main/toast', () => ({ heroToastXml }));

import { notifyScreenshotCaptured } from '../../../src/main/notifier';

const realPlatform = process.platform;
const setPlatform = (value: NodeJS.Platform) =>
  Object.defineProperty(process, 'platform', { value, configurable: true });

const STATS: LiveStats = {
  status: 'tracking',
  sessionActiveMs: 2 * 3_600_000 + 5 * 60_000,
  sessionIdleMs: 2 * 3_600_000 + 5 * 60_000,
  keyCount: 1200,
  mouseCount: 345,
  currentApp: 'Code',
  screenshotCount: 0,
  pendingSync: 0,
  lastSyncAt: null,
  syncing: false,
  dayActiveMs: 0,
  lastSyncOutcome: null,
};
const ONE = { count: 1, capturedAt: '2026-09-14T10:30:00.000Z' };

beforeEach(() => {
  resetCenter();
  createFromBuffer.mockReset();
  heroToastXml.mockClear();
});

afterEach(() => {
  setPlatform(realPlatform);
});

describe('notifyScreenshotCaptured', () => {
  it('says a shot was taken, with the session so far and how to open it', () => {
    setPlatform('linux');
    const onOpen = vi.fn();

    notifyScreenshotCaptured(ONE, STATS, { silent: false, onOpen });

    const shown = lastShown();
    expect(shown.options.title).toBe('Exyconn Tracker — Screenshot captured');
    expect(shown.options.body).toBe(
      [
        'Worked 2h 05m · 50% active',
        `${(1200).toLocaleString()} keys · ${(345).toLocaleString()} clicks`,
        'In Code',
        'Click to open it',
      ].join('\n'),
    );
    expect(shown.options).toMatchObject({ silent: false, icon: undefined, toastXml: undefined });
    expect(shown.shown).toBe(true);

    shown.events.get('click')?.();
    expect(onOpen).toHaveBeenCalled();
  });

  it('counts a burst, drops the app line when none is known, and reads an empty session as 0%', () => {
    const empty = { ...STATS, sessionActiveMs: 0, sessionIdleMs: 0, currentApp: '' };

    notifyScreenshotCaptured({ ...ONE, count: 3 }, empty, { silent: true, onOpen: vi.fn() });

    expect(lastShown().options.title).toBe('Exyconn Tracker — 3 screenshots captured');
    expect(lastShown().options.body).not.toContain('In ');
    expect(lastShown().options.body).toContain('Worked 0h 00m · 0% active');
    expect(lastShown().options.silent).toBe(true);
  });

  it('shows a downscaled preview of the shot, across the top of the toast on Windows', () => {
    setPlatform('win32');
    const small = { id: 'preview' };
    const resize = vi.fn(() => small);
    createFromBuffer.mockReturnValue({ isEmpty: () => false, resize });

    notifyScreenshotCaptured(ONE, STATS, { image: 'aW1hZ2U=', silent: false, onOpen: vi.fn() });

    expect(createFromBuffer).toHaveBeenCalledWith(Buffer.from('aW1hZ2U=', 'base64'));
    expect(resize).toHaveBeenCalledWith({ width: 480, quality: 'good' });
    expect(heroToastXml).toHaveBeenCalledWith(
      'Exyconn Tracker — Screenshot captured',
      expect.arrayContaining(['In Code']),
      small,
    );
    expect(lastShown().options).toMatchObject({ icon: small, toastXml: '<toast/>' });
  });

  it('puts the preview beside the text elsewhere', () => {
    setPlatform('darwin');
    const small = { id: 'preview' };
    createFromBuffer.mockReturnValue({ isEmpty: () => false, resize: () => small });

    notifyScreenshotCaptured(ONE, STATS, { image: 'aW1hZ2U=', silent: false, onOpen: vi.fn() });

    expect(heroToastXml).not.toHaveBeenCalled();
    expect(lastShown().options).toMatchObject({ icon: small, toastXml: undefined });
  });

  it('still notifies, without a picture, when the preview cannot be decoded', () => {
    setPlatform('win32');
    createFromBuffer.mockReturnValueOnce({ isEmpty: () => true });
    notifyScreenshotCaptured(ONE, STATS, { image: 'YnJva2Vu', silent: false, onOpen: vi.fn() });
    expect(lastShown().options.icon).toBeUndefined();

    createFromBuffer.mockImplementationOnce(() => {
      throw new Error('bad image');
    });
    notifyScreenshotCaptured(ONE, STATS, { image: 'YnJva2Vu', silent: false, onOpen: vi.fn() });
    expect(lastShown().options.icon).toBeUndefined();
    expect(center.shown).toHaveLength(2);
    expect(heroToastXml).not.toHaveBeenCalled();
  });

  it('forgets a notification once the OS closes it or fails to show it', () => {
    notifyScreenshotCaptured(ONE, STATS, { silent: false, onOpen: vi.fn() });

    const { events } = lastShown();
    expect(events.has('close')).toBe(true);
    expect(events.has('failed')).toBe(true);
    expect(() => {
      events.get('close')?.();
      events.get('failed')?.();
    }).not.toThrow();
  });

  it('skips quietly when notifications are unsupported or broken', () => {
    center.supported = false;
    notifyScreenshotCaptured(ONE, STATS, { silent: false, onOpen: vi.fn() });
    expect(center.shown).toHaveLength(0);

    center.supported = true;
    center.broken = true;
    expect(() =>
      notifyScreenshotCaptured(ONE, STATS, { silent: false, onOpen: vi.fn() }),
    ).not.toThrow();
    expect(center.shown).toHaveLength(0);
  });
});
