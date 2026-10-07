import { describe, expect, it } from 'vitest';
import type { TrackerSettings } from '../../src/types';
import { autoStopNotice } from '../../src/auto-stop';
import { t } from './translator';

const SETTINGS = {
  autoStartEnabled: true,
  autoStartHour: 9,
  autoStopHour: 18,
} as TrackerSettings;

describe('autoStopNotice last minute', () => {
  it('counts the final minute in the singular', () => {
    const notice = autoStopNotice(
      t,
      SETTINGS,
      'UTC',
      'tracking',
      new Date('2026-09-08T17:59:00.000Z'),
    );

    expect(notice?.title).toBe('Tracking stops in 1 minute');
  });
});
