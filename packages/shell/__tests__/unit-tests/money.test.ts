import { describe, it, expect } from 'vitest';
import { setActiveFormatSettings, DEFAULT_FORMAT_SETTINGS } from '@exyconn/i18n';
import { formatMoney } from '../../src/utils/money';

describe('formatMoney', () => {
  it("is in the company's own money, whatever that is", () => {
    setActiveFormatSettings({ ...DEFAULT_FORMAT_SETTINGS, locale: 'en-IN', currency: 'INR' });
    expect(formatMoney(92000)).toBe('₹92,000');

    setActiveFormatSettings({ ...DEFAULT_FORMAT_SETTINGS, locale: 'de-DE', currency: 'EUR' });
    expect(formatMoney(92000)).toContain('€');
  });

  it("honours a record's own currency over the company's", () => {
    setActiveFormatSettings({ ...DEFAULT_FORMAT_SETTINGS, locale: 'en-US', currency: 'INR' });
    const usd = formatMoney(1500, 'USD');
    expect(usd).toContain('1,500');
    expect(usd).toContain('$');
  });

  it('is a plain number before any company settings have arrived', () => {
    setActiveFormatSettings(DEFAULT_FORMAT_SETTINGS);
    expect(formatMoney(92000)).toBe('92,000');
    expect(formatMoney(0)).toBe('0');
  });
});
