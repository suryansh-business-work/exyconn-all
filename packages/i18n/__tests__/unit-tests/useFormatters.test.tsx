import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { setActiveFormatSettings } from '../../src/active-settings';
import { DEFAULT_FORMAT_SETTINGS } from '../../src/format';
import { I18nProvider } from '../../src/I18nProvider';
import { useFormatters } from '../../src/useFormatters';

const BERLIN = {
  timezone: 'Europe/Berlin',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  currency: 'EUR',
};

const MESSAGES = {};

/** 31 Dec 2025, 20:30 UTC — 21:30 in Berlin. */
const INSTANT = '2025-12-31T20:30:00.000Z';

function GermanProvider({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <I18nProvider locale="de-DE" messages={MESSAGES} settings={BERLIN}>
      {children}
    </I18nProvider>
  );
}

function renderGerman() {
  return renderHook(() => useFormatters(), { wrapper: GermanProvider });
}

afterEach(() => {
  vi.useRealTimers();
  setActiveFormatSettings(DEFAULT_FORMAT_SETTINGS);
});

describe('useFormatters', () => {
  it('writes dates and times in the provider’s zone and patterns', () => {
    const { result } = renderGerman();

    expect(result.current.formatDate(INSTANT)).toBe('31.12.2025');
    expect(result.current.formatDateTime(INSTANT)).toBe('31.12.2025 21:30');
    expect(result.current.formatTime(INSTANT)).toBe('21:30');
    expect(result.current.formatTime(null)).toBe('');
  });

  it('writes how long ago in the provider’s language', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-03T20:30:00.000Z'));
    const { result } = renderGerman();

    expect(result.current.formatRelative(INSTANT)).toBe('vor 3 Tagen');
  });

  it('writes numbers, money and percentages in the provider’s notation', () => {
    const { result } = renderGerman();

    expect(result.current.formatNumber(1234.5)).toBe('1.234,5');
    expect(result.current.formatNumber(1234.567, { maximumFractionDigits: 1 })).toBe('1.234,6');
    expect(result.current.formatCurrency(10)).toContain('€');
    expect(result.current.formatCurrency(10, { currency: 'USD' })).toContain('$');
    expect(result.current.formatPercent(50)).toMatch(/^50\s?%$/u);
    expect(result.current.formatPercent(12.5, { maximumFractionDigits: 1 })).toMatch(/^12,5\s?%$/u);
  });

  it('joins lists in the provider’s language', () => {
    const { result } = renderGerman();

    expect(result.current.formatList(['Ada', 'Bob', 'Cy'])).toBe('Ada, Bob und Cy');
  });

  it('keeps the same formatters across renders while the settings stay put', () => {
    const { result, rerender } = renderGerman();
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('formats with the English, UTC defaults outside any provider', () => {
    const { result } = renderHook(() => useFormatters());

    expect(result.current.formatDateTime(INSTANT)).toBe('31 Dec 2025 08:30 PM');
    expect(result.current.formatCurrency(1000)).toBe('1,000');
  });
});
