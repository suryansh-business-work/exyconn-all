import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatPercent,
  formatRelative,
  type FormatSettings,
} from '../../src/format';

const KOLKATA: FormatSettings = {
  locale: 'en-IN',
  timezone: 'Asia/Kolkata',
  dateFormat: 'dd MMM yyyy',
  timeFormat: 'HH:mm',
  currency: 'INR',
};

const BERLIN: FormatSettings = {
  locale: 'de-DE',
  timezone: 'Europe/Berlin',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  currency: 'EUR',
};

/** 31 Dec 2025, 20:30 UTC — the next day in Kolkata, the same day in Berlin. */
const INSTANT = '2025-12-31T20:30:00.000Z';

describe('dates', () => {
  it('renders an instant in the reader’s own zone, not the server’s', () => {
    // The whole point: 20:30 UTC is already tomorrow in Kolkata.
    expect(formatDate(INSTANT, KOLKATA)).toBe('01 Jan 2026');
    expect(formatDate(INSTANT, BERLIN)).toBe('31.12.2025');
  });

  it('renders the clock time in that zone too', () => {
    expect(formatDateTime(INSTANT, KOLKATA)).toBe('01 Jan 2026 02:00');
    expect(formatDateTime(INSTANT, BERLIN)).toBe('31.12.2025 21:30');
  });

  it('renders nothing for a value that is not an instant', () => {
    // A table cell reading "Invalid Date" is a bug report.
    for (const value of [null, undefined, '', 'not a date']) {
      expect(formatDate(value, KOLKATA)).toBe('');
    }
  });
});

describe('numbers and money', () => {
  it('groups digits the way the reader’s language groups them', () => {
    // India groups in lakhs; Germany groups in thousands with a dot.
    expect(formatNumber(1234567, KOLKATA)).toBe('12,34,567');
    expect(formatNumber(1234567, BERLIN)).toBe('1.234.567');
  });

  it('renders money in the workspace’s currency', () => {
    expect(formatCurrency(1000, BERLIN)).toContain('€');
    expect(formatCurrency(1000, KOLKATA)).toContain('₹');
  });

  it('renders a 0-100 value as a percentage', () => {
    expect(formatPercent(42, KOLKATA)).toBe('42%');
  });

  it('renders nothing for a missing number rather than "NaN"', () => {
    expect(formatNumber(null, KOLKATA)).toBe('');
    expect(formatNumber(Number.NaN, KOLKATA)).toBe('');
    expect(formatPercent(undefined, KOLKATA)).toBe('');
  });
});

describe('relative time', () => {
  const now = new Date('2026-01-10T12:00:00.000Z');

  it('says how long ago in the reader’s own language', () => {
    expect(formatRelative('2026-01-07T12:00:00.000Z', KOLKATA, now)).toBe('3 days ago');
    expect(formatRelative('2026-01-07T12:00:00.000Z', BERLIN, now)).toBe('vor 3 Tagen');
  });

  it('handles the near past in smaller units', () => {
    expect(formatRelative('2026-01-10T11:30:00.000Z', KOLKATA, now)).toBe('30 minutes ago');
  });
});

describe('lists', () => {
  it('joins a list the way the language joins lists', () => {
    // en-IN joins without the Oxford comma; German uses "und" and no comma at all.
    expect(formatList(['a', 'b', 'c'], KOLKATA)).toBe('a, b and c');
    expect(formatList(['a', 'b', 'c'], BERLIN)).toBe('a, b und c');
  });
});
