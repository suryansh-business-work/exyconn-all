import { describe, expect, it } from 'vitest';
import {
  ACCOUNTS_PARAM,
  connectedOnly,
  selectedAccountIds,
  withAccountIds,
} from '../../src/pages/social/CalendarTab/calendar.selection';

describe('calendar account selection', () => {
  it('reads the chosen accounts from the address, none meaning all', () => {
    expect(selectedAccountIds(new URLSearchParams('accounts=a1,a2'))).toEqual(['a1', 'a2']);
    expect(selectedAccountIds(new URLSearchParams('accounts='))).toEqual([]);
    expect(selectedAccountIds(new URLSearchParams(''))).toEqual([]);
  });

  it('writes a choice into the address, keeping everything else', () => {
    const params = new URLSearchParams('tab=x');
    const chosen = withAccountIds(params, ['a1', 'a2']);
    expect(chosen.toString()).toBe('tab=x&accounts=a1%2Ca2');
    expect(params.has(ACCOUNTS_PARAM)).toBe(false);
    expect(withAccountIds(chosen, []).toString()).toBe('tab=x');
  });

  it('keeps only the chosen accounts that are still connected', () => {
    const accounts = [{ id: 'a1' }, { id: 'a2' }];
    expect(connectedOnly(['a2', 'gone', 'a1'], accounts)).toEqual(['a2', 'a1']);
    expect(connectedOnly(['gone'], accounts)).toEqual([]);
  });
});
