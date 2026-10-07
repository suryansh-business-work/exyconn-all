import { describe, expect, it } from 'vitest';
import { act } from '@testing-library/react';
import { useCalendarAccounts } from '../../../../../src/pages/social/CalendarTab/useCalendarAccounts';
import { renderHookWithProviders, useCurrentUrl } from '../../../test-utils';

const ACCOUNTS = [{ id: 'a1' }, { id: 'a2' }];

function renderAt(route: string) {
  return renderHookWithProviders(
    () => ({ accounts: useCalendarAccounts(ACCOUNTS), url: useCurrentUrl() }),
    { route },
  );
}

describe('useCalendarAccounts', () => {
  it('reads the chosen accounts from the address, ignoring ones no longer connected', () => {
    const { result } = renderAt('/marketing/social/calendar?accounts=a2,gone');

    expect(result.current.accounts.selected).toEqual(['a2']);
  });

  it('chooses every account when the address names none', () => {
    const { result } = renderAt('/marketing/social/calendar');

    expect(result.current.accounts.selected).toEqual([]);
  });

  it('writes a new choice into the address, keeping the rest of it', () => {
    const { result } = renderAt('/marketing/social/calendar?view=month');

    act(() => result.current.accounts.choose(['a1', 'a2']));

    expect(result.current.url).toBe('/marketing/social/calendar?view=month&accounts=a1%2Ca2');
    expect(result.current.accounts.selected).toEqual(['a1', 'a2']);

    act(() => result.current.accounts.choose([]));

    expect(result.current.url).toBe('/marketing/social/calendar?view=month');
  });
});
