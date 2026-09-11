import { describe, expect, it } from 'vitest';
import type { MobileUpdateState } from '../../../src/tracker/updates';
import { installNote, updateStatus } from '../../../src/lib/settings/update-status';

const NOW = Date.parse('2026-09-11T10:00:00Z');
const IDLE: MobileUpdateState = { stage: 'idle', version: '', url: '', lastCheckedAt: null };

describe('updateStatus', () => {
  it('admits it has not looked yet', () => {
    expect(updateStatus(IDLE, NOW)).toBe('Not checked yet since this app started.');
  });

  it('says when an up-to-date check happened, so the button visibly answers', () => {
    const checked = { ...IDLE, lastCheckedAt: '2026-09-11T09:55:00Z' };
    expect(updateStatus(checked, NOW)).toBe('Up to date — checked 5m ago.');
  });

  it('says "just now" for a check that just finished', () => {
    const checked = { ...IDLE, lastCheckedAt: '2026-09-11T09:59:40Z' };
    expect(updateStatus(checked, NOW)).toBe('Up to date — checked just now.');
  });

  it('describes a check in flight, a newer build, and a failed check', () => {
    expect(updateStatus({ ...IDLE, stage: 'checking' }, NOW)).toBe('Looking for a newer version…');
    expect(updateStatus({ ...IDLE, stage: 'available', version: '2.0.0' }, NOW)).toBe(
      'Version 2.0.0 is available.',
    );
    expect(updateStatus({ ...IDLE, stage: 'failed' }, NOW)).toBe(
      'The last check could not reach the update service.',
    );
  });
});

describe('installNote', () => {
  it('explains who installs on each platform', () => {
    expect(installNote(true)).toMatch(/Android asks you before installing/);
    expect(installNote(false)).toMatch(/installed by your administrator/);
  });
});
