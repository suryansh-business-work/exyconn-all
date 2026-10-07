import { describe, expect, it } from 'vitest';
import { presenceCaption } from '../../../../src/lib/dashboard/presence-text';
import { t } from '../../translator';

const NOW = Date.parse('2026-09-11T07:24:00.000Z');

describe('presenceCaption', () => {
  it('says since when Working was set, without any pause warning', () => {
    const caption = presenceCaption(
      t,
      { status: 'WORKING', note: '', since: '2026-09-11T07:00:00.000Z' },
      'UTC',
      NOW,
    );
    expect(caption).toBe('Since 7:00 AM · 24m ago');
  });

  it('drops the time when the portal sent an unreadable instant', () => {
    expect(presenceCaption(t, { status: 'WORKING', note: '', since: 'garbage' }, 'UTC', NOW)).toBe(
      '',
    );
    expect(presenceCaption(t, { status: 'LUNCH', note: '', since: 'garbage' }, 'UTC', NOW)).toBe(
      ' — tracking stays paused until you are back on Working.',
    );
  });
});
