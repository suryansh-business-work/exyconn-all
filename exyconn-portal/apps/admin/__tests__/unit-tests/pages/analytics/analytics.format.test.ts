import { describe, expect, it } from 'vitest';
import { countryName } from '@exyconn/i18n';
import {
  count,
  hours,
  percent,
  withCountryNames,
  withPlatformNames,
} from '../../../../src/pages/analytics/analytics.format';

describe('analytics formatters', () => {
  it('rounds counts and writes them in the locale notation', () => {
    expect(count(1234.6)).toBe((1235).toLocaleString());
    expect(count(0)).toBe('0');
  });

  it('writes hours to one decimal place with an h suffix', () => {
    expect(hours(3)).toBe('3.0h');
    expect(hours(2.46)).toBe('2.5h');
  });

  it('rounds percentages to whole numbers', () => {
    expect(percent(66.6)).toBe('67%');
    expect(percent(0)).toBe('0%');
  });
});

describe('withCountryNames', () => {
  it('names each country code and replaces the API "Not set" with the given text', () => {
    const named = withCountryNames(
      [
        { label: 'IN', value: 4 },
        { label: 'Not set', value: 2 },
      ],
      "Company's country",
    );
    expect(named).toEqual([
      { label: countryName('IN'), value: 4 },
      { label: "Company's country", value: 2 },
    ]);
  });
});

describe('withPlatformNames', () => {
  it('names the tracker platforms people know and keeps unknown codes as they are', () => {
    const named = withPlatformNames([
      { label: 'darwin', value: 1 },
      { label: 'win32', value: 2 },
      { label: 'android', value: 3 },
      { label: 'ios', value: 4 },
      { label: 'linux', value: 5 },
    ]);
    expect(named.map((metric) => metric.label)).toEqual([
      'macOS',
      'Windows',
      'Android',
      'iOS',
      'linux',
    ]);
    expect(named.map((metric) => metric.value)).toEqual([1, 2, 3, 4, 5]);
  });
});
