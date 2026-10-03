import { describe, expect, it } from 'vitest';
import { projectHint, ticketHint } from '../../src/booking-hint';
import { t } from './translator';

describe('projectHint', () => {
  it('says the list is loading before anything else', () => {
    expect(projectHint(t, { loading: true, locked: true })).toBe('Loading projects…');
  });

  it('explains the lock while tracking, and says nothing otherwise', () => {
    expect(projectHint(t, { loading: false, locked: true })).toContain('Locked while tracking');
    expect(projectHint(t, { loading: false, locked: false })).toBeUndefined();
  });
});

describe('ticketHint', () => {
  it('says the tickets are loading before anything else', () => {
    expect(ticketHint(t, { loading: true, locked: true })).toBe('Loading tickets…');
  });

  it('explains the lock while tracking, else that a ticket is optional', () => {
    expect(ticketHint(t, { loading: false, locked: true })).toContain('another ticket');
    expect(ticketHint(t, { loading: false, locked: false })).toBe('Optional.');
  });
});
