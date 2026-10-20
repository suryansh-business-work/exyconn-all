import { describe, expect, it } from 'vitest';
import { format } from 'date-fns';
import { DATE_FORMATS, TIME_FORMATS, isDateFormat, isTimeFormat } from '../../src';

describe('the offered date and time patterns', () => {
  it('starts the dates with ISO 8601', () => {
    expect(DATE_FORMATS[0]).toBe('yyyy-MM-dd');
  });

  it('only offers patterns date-fns can write', () => {
    const day = new Date(2026, 9, 21, 15, 4, 5);
    for (const pattern of [...DATE_FORMATS, ...TIME_FORMATS]) {
      expect(format(day, pattern)).not.toBe('');
    }
    expect(format(day, 'HH:mm:ss')).toBe('15:04:05');
  });

  it('tells an offered pattern from anything else', () => {
    expect(isDateFormat('dd/MM/yyyy')).toBe(true);
    expect(isDateFormat('HH:mm')).toBe(false);
    expect(isTimeFormat('hh:mm a')).toBe(true);
    expect(isTimeFormat('yyyy-MM-dd')).toBe(false);
  });
});
