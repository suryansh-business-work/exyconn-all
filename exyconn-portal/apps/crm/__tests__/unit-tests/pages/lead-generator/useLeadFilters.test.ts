import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLeadFilters } from '../../../../src/pages/lead-generator/useLeadFilters';
import type { EmailLookup } from '../../../../src/pages/lead-generator/leadTypes';
import { foundLookup, leadPlace, missLookup } from './lead-fixtures';

const withBoth = leadPlace({ placeId: 'both' });
const noPhone = leadPlace({ placeId: 'no-phone', phone: '' });
const noSite = leadPlace({ placeId: 'no-site', website: '' });
const places = [withBoth, noPhone, noSite];

function render(lookups: Record<string, EmailLookup>) {
  return renderHook(() => useLeadFilters(places, lookups));
}

describe('useLeadFilters', () => {
  it('shows every place while no filter is on', () => {
    const { result } = render({});

    expect(result.current.visible).toEqual(places);
    expect(result.current.hasPhone).toBe(false);
    expect(result.current.hasEmail).toBe(false);
    expect(result.current.needsLookup).toBe(false);
  });

  it('"Has phone" hides places without a phone number, and toggles back off', () => {
    const { result } = render({});

    act(() => result.current.togglePhone());
    expect(result.current.hasPhone).toBe(true);
    expect(result.current.visible).toEqual([withBoth, noSite]);

    act(() => result.current.togglePhone());
    expect(result.current.visible).toEqual(places);
  });

  it('"Has email" keeps only places whose website lookup found addresses', () => {
    const { result } = render({
      both: foundLookup(['hi@smile.example']),
      'no-phone': missLookup('No address published'),
    });

    act(() => result.current.toggleEmail());

    expect(result.current.hasEmail).toBe(true);
    expect(result.current.visible).toEqual([withBoth]);
    expect(result.current.needsLookup).toBe(false);
  });

  it('flags places with a website that were not looked up yet, or are still being read', () => {
    const pending = render({ both: { status: 'PENDING' }, 'no-phone': missLookup('None') });
    act(() => pending.result.current.toggleEmail());
    expect(pending.result.current.needsLookup).toBe(true);

    const unseen = render({ both: foundLookup(['hi@smile.example']) });
    act(() => unseen.result.current.toggleEmail());
    expect(unseen.result.current.needsLookup).toBe(true);
  });

  it('applies both filters together', () => {
    const { result } = render({
      both: foundLookup(['hi@smile.example']),
      'no-phone': foundLookup(['x@y.example']),
    });

    act(() => result.current.togglePhone());
    act(() => result.current.toggleEmail());

    expect(result.current.visible).toEqual([withBoth]);
  });
});
