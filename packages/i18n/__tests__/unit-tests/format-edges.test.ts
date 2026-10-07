import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_FORMAT_SETTINGS,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
  type FormatSettings,
} from '../../src/format';

const NEW_YORK: FormatSettings = {
  locale: 'en-US',
  timezone: 'America/New_York',
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm',
  currency: 'USD',
};

/** 15 Jan 2026, 03:15 UTC — still the 14th in New York. */
const INSTANT_MS = Date.UTC(2026, 0, 15, 3, 15);

afterEach(() => {
  vi.useRealTimers();
});

describe('the defaults a workspace starts with', () => {
  it('renders in English and UTC with no currency until settings arrive', () => {
    expect(DEFAULT_FORMAT_SETTINGS.currency).toBe('');
    expect(formatDateTime(INSTANT_MS, DEFAULT_FORMAT_SETTINGS)).toBe('15 Jan 2026 03:15 AM');
    expect(formatCurrency(1234.5, DEFAULT_FORMAT_SETTINGS)).toBe('1,234.5');
  });
});

describe('date inputs', () => {
  it('accepts a Date, an epoch number and an ISO string alike', () => {
    expect(formatDate(new Date(INSTANT_MS), NEW_YORK)).toBe('2026-01-14');
    expect(formatDate(INSTANT_MS, NEW_YORK)).toBe('2026-01-14');
    expect(formatDate('2026-01-15T03:15:00.000Z', NEW_YORK)).toBe('2026-01-14');
  });

  it('treats the epoch itself as an instant, not as a missing value', () => {
    expect(formatDate(0, NEW_YORK)).toBe('1969-12-31');
  });

  it('renders nothing for an invalid Date object', () => {
    expect(formatDate(new Date(Number.NaN), NEW_YORK)).toBe('');
  });
});

describe('formatTime', () => {
  it('renders just the clock time in the reader’s zone', () => {
    expect(formatTime(INSTANT_MS, NEW_YORK)).toBe('22:15');
  });

  it('follows the workspace’s time pattern', () => {
    expect(formatTime(INSTANT_MS, { ...NEW_YORK, timeFormat: 'hh:mm a' })).toBe('10:15 PM');
  });

  it('renders nothing for a value that is not an instant', () => {
    for (const value of [null, undefined, '', 'soon']) {
      expect(formatTime(value, NEW_YORK)).toBe('');
    }
  });
});

describe('formatDateTime', () => {
  it('renders nothing for a value that is not an instant', () => {
    for (const value of [null, undefined, '', 'yesterday', Number.NaN]) {
      expect(formatDateTime(value, NEW_YORK)).toBe('');
    }
  });
});

describe('numbers with options', () => {
  it('passes Intl options through', () => {
    expect(formatNumber(3.14159, NEW_YORK, { maximumFractionDigits: 2 })).toBe('3.14');
    expect(formatNumber(0, NEW_YORK)).toBe('0');
  });

  it('lets a caller override the percentage precision', () => {
    expect(formatPercent(12.345, NEW_YORK)).toBe('12%');
    expect(formatPercent(12.345, NEW_YORK, { maximumFractionDigits: 1 })).toBe('12.3%');
    expect(formatPercent(0, NEW_YORK)).toBe('0%');
  });

  it('renders nothing for a missing percentage or amount', () => {
    expect(formatPercent(null, NEW_YORK)).toBe('');
    expect(formatPercent(Number.NaN, NEW_YORK)).toBe('');
    expect(formatCurrency(undefined, NEW_YORK)).toBe('');
    expect(formatCurrency(Number.NaN, NEW_YORK)).toBe('');
  });

  it('keeps the caller’s other options when writing money', () => {
    expect(formatCurrency(5, NEW_YORK, { minimumFractionDigits: 0 })).toBe('$5');
  });
});

describe('formatRelative edges', () => {
  const now = new Date('2026-03-01T12:00:00.000Z');
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

  it('counts seconds below a minute', () => {
    expect(formatRelative(ago(45), NEW_YORK, now)).toBe('45 seconds ago');
  });

  it('says "now" for the same instant', () => {
    expect(formatRelative(now, NEW_YORK, now)).toBe('now');
  });

  it('switches unit exactly at each boundary', () => {
    expect(formatRelative(ago(59), NEW_YORK, now)).toBe('59 seconds ago');
    expect(formatRelative(ago(60), NEW_YORK, now)).toBe('1 minute ago');
    expect(formatRelative(ago(3600), NEW_YORK, now)).toBe('1 hour ago');
    expect(formatRelative(ago(86_400), NEW_YORK, now)).toBe('yesterday');
    expect(formatRelative(ago(2_592_000), NEW_YORK, now)).toBe('last month');
    expect(formatRelative(ago(31_536_000), NEW_YORK, now)).toBe('last year');
  });

  it('truncates rather than rounds within a unit', () => {
    expect(formatRelative(ago(3600 * 2 + 3500), NEW_YORK, now)).toBe('2 hours ago');
  });

  it('describes the future too', () => {
    expect(formatRelative(ago(-7200), NEW_YORK, now)).toBe('in 2 hours');
    expect(formatRelative(ago(-86_400 * 3), NEW_YORK, now)).toBe('in 3 days');
  });

  it('measures from the current time when no "now" is given', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(formatRelative(ago(120), NEW_YORK)).toBe('2 minutes ago');
  });

  it('renders nothing for a value that is not an instant', () => {
    expect(formatRelative(null, NEW_YORK, now)).toBe('');
    expect(formatRelative('later', NEW_YORK, now)).toBe('');
  });
});

describe('formatList edges', () => {
  it('handles empty, single and pair lists', () => {
    expect(formatList([], NEW_YORK)).toBe('');
    expect(formatList(['a'], NEW_YORK)).toBe('a');
    expect(formatList(['a', 'b'], NEW_YORK)).toBe('a and b');
  });
});
