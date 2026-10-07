import { beforeEach, describe, expect, it, vi } from 'vitest';

const { center, FakeNotification, lastShown, resetCenter } = await vi.hoisted(
  () => import('./notification-fake'),
);

vi.mock('electron', () => ({ Notification: FakeNotification, nativeImage: {} }));
vi.mock('../../../src/main/toast', () => ({ heroToastXml: vi.fn() }));

import {
  notifyAutoPaused,
  notifyAutoStopped,
  notifyMessages,
  notifyNotice,
} from '../../../src/main/notifier';

beforeEach(resetCenter);

describe('the other notices', () => {
  it.each([
    [
      () => notifyAutoPaused(10),
      'Exyconn Tracker — paused',
      'No activity for 10 minutes. Press Resume when you are back.',
    ],
    [
      () => notifyAutoStopped('7:00 PM'),
      'Exyconn Tracker — stopped for the day',
      'Your tracking window ended at 7:00 PM. Time from now on is not being logged.',
    ],
    [
      () => notifyNotice('Office closed', 'Friday is a holiday.'),
      'Exyconn Tracker — Office closed',
      'Friday is a holiday.',
    ],
    [
      () => notifyMessages(1),
      'Exyconn Tracker — message',
      'You have a new message from your workspace. Open Messages in the tracker to read it.',
    ],
    [
      () => notifyMessages(4),
      'Exyconn Tracker — message',
      'You have 4 new messages from your workspace. Open Messages in the tracker to read it.',
    ],
  ])('shows %#', (notify, title, body) => {
    notify();

    expect(lastShown().options).toEqual({ title, body, silent: false });
    expect(lastShown().shown).toBe(true);
  });

  it.each([
    () => notifyAutoPaused(10),
    () => notifyAutoStopped('7:00 PM'),
    () => notifyNotice('t', 'b'),
    () => notifyMessages(2),
  ])('never throws and never shows when the centre is unsupported or broken (%#)', (notify) => {
    center.supported = false;
    notify();
    center.supported = true;
    center.broken = true;

    expect(() => notify()).not.toThrow();
    expect(center.shown).toHaveLength(0);
  });
});
