import { createHmac } from 'node:crypto';
import { majorUnits, minorUnits } from '../../../../../src/modules/clienthub/payments/minorUnits';
import { hmacHex, sameHex } from '../../../../../src/modules/clienthub/payments/signature';
import { asArg } from '../../../../mockAs';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('minorUnits and majorUnits', () => {
  it.each([
    ['USD', 12.34, 1234],
    ['INR', 10.5, 1050],
    ['JPY', 1500, 1500],
    ['KWD', 1.234, 1234],
  ])('converts %s by its own number of decimals', (currency, amount, minor) => {
    expect(minorUnits(amount, currency)).toBe(minor);
  });

  it.each([
    ['USD', 1234, 12.34],
    ['JPY', 1500, 1500],
    ['KWD', 1235, 1.235],
  ])('converts %s back to the invoice amount', (currency, minor, amount) => {
    expect(majorUnits(minor, currency)).toBeCloseTo(amount, 6);
  });

  it('falls back to two decimals when the runtime reports none for a currency', () => {
    jest.spyOn(Intl.NumberFormat.prototype, 'resolvedOptions').mockReturnValue(asArg({}));

    expect(minorUnits(1.5, 'USD')).toBe(150);
    expect(majorUnits(150, 'USD')).toBe(1.5);
  });
});

describe('signature helpers', () => {
  const secret = `whsec_${'s'.repeat(20)}`;

  it('computes the hex HMAC-SHA256 of a payload', () => {
    const expected = createHmac('sha256', secret).update('payload').digest('hex');

    expect(hmacHex(secret, 'payload')).toBe(expected);
    expect(hmacHex(secret, Buffer.from('payload'))).toBe(expected);
  });

  it('accepts only an identical, non-empty digest', () => {
    const digest = hmacHex(secret, 'payload');

    expect(sameHex(digest, digest)).toBe(true);
    expect(sameHex(digest, hmacHex(secret, 'other'))).toBe(false);
    expect(sameHex(digest.slice(0, 10), digest)).toBe(false);
    expect(sameHex('', '')).toBe(false);
    expect(sameHex('zz', 'zz')).toBe(false);
  });
});
