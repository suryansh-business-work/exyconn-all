import { describe, expect, it } from 'vitest';
import { t } from '../translator';
import type { TrackerTask } from '@exyconn/tracker-core';
import { presenceCaption } from '../../../src/lib/dashboard/presence-text';
import { syncPendingText, syncPolicyText } from '../../../src/lib/dashboard/sync-text';
import { NO_TICKET, ticketOptions } from '../../../src/lib/dashboard/ticket-options';
import { settings, stats } from './fixtures';

describe('sync text', () => {
  it('states the upload cadence', () => {
    expect(syncPolicyText(settings())).toBe('Uploads automatically every 5 minutes');
    expect(syncPolicyText(settings({ syncIntervalMinutes: 1 }))).toBe(
      'Uploads automatically every 1 minute',
    );
    expect(syncPolicyText(null)).toBe('Sync policy unavailable');
  });

  it('says what the outbox holds', () => {
    expect(syncPendingText(stats({ syncing: true, pendingSync: 4 }))).toBe('Uploading…');
    expect(syncPendingText(stats())).toBe('Everything uploaded');
    expect(syncPendingText(stats({ pendingSync: 4 }))).toBe('4 waiting to upload');
  });
});

describe('presenceCaption', () => {
  const now = Date.parse('2026-09-11T07:24:00.000Z');

  it('says tracking runs as normal when no presence was ever set', () => {
    expect(presenceCaption(t, { status: 'WORKING', note: '', since: null }, 'UTC', now)).toBe(
      'Tracking runs as normal.',
    );
  });

  it('says since when, in the zone, and that an away status keeps tracking paused', () => {
    const caption = presenceCaption(
      t,
      { status: 'LUNCH', note: 'Back at 2', since: '2026-09-11T07:00:00.000Z' },
      'Asia/Kolkata',
      now,
    );
    expect(caption).toBe(
      'Since 12:30 PM · 24m ago — tracking stays paused until you are back on Working.',
    );
  });
});

describe('ticketOptions', () => {
  const tasks: TrackerTask[] = [
    { id: 't1', key: 'EXY-1', title: 'Someone else', assignedToMe: false },
    { id: 't2', key: 'EXY-2', title: 'Mine', assignedToMe: true },
  ];

  it('leads with no ticket, then my tickets, then everything else', () => {
    expect(ticketOptions(tasks)).toEqual([
      NO_TICKET,
      { value: 't2', label: 'EXY-2 · Mine', caption: 'Assigned to me' },
      { value: 't1', label: 'EXY-1 · Someone else', caption: undefined },
    ]);
  });

  it('still offers no ticket on an empty board', () => {
    expect(ticketOptions([])).toEqual([NO_TICKET]);
  });
});
