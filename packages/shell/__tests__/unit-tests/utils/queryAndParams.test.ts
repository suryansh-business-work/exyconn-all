import { describe, expect, it } from 'vitest';
import { queryData } from '@/utils/queryData';
import { withParam } from '@/utils/searchParams';

describe('queryData', () => {
  it('returns the data of a completed query, even a falsy one', () => {
    expect(queryData({ data: { me: { id: '1' } } }, 'Me')).toEqual({ me: { id: '1' } });
    expect(queryData({ data: null }, 'Me')).toBeNull();
  });

  it('throws naming the operation when there is no data', () => {
    expect(() => queryData({}, 'ListInvoices')).toThrow('ListInvoices returned no data');
  });
});

describe('withParam', () => {
  it('sets a param and keeps every other one, without touching the original', () => {
    const current = new URLSearchParams('employee=e1&month=2026-01');
    const next = withParam(current, 'month', '2026-02');

    expect(next.toString()).toBe('employee=e1&month=2026-02');
    expect(current.get('month')).toBe('2026-01');
  });

  it('adds a param that was not there', () => {
    expect(withParam(new URLSearchParams('a=1'), 'date', '2026-02-03').toString()).toBe(
      'a=1&date=2026-02-03',
    );
  });

  it('removes the param when the value is null', () => {
    expect(withParam(new URLSearchParams('a=1&date=x'), 'date', null).toString()).toBe('a=1');
  });

  it('keeps an empty string as a value rather than removing it', () => {
    expect(withParam(new URLSearchParams(), 'q', '').toString()).toBe('q=');
  });
});
