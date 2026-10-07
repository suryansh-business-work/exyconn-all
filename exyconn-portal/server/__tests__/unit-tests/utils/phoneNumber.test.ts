import { isPhoneNumber } from '../../../src/utils/phoneNumber';

describe('isPhoneNumber', () => {
  it.each(['+91 98765 43210', '(555) 123-4567', '0201234567', '1234567'])('accepts %s', (value) => {
    expect(isPhoneNumber(value)).toBe(true);
  });

  it.each([
    ['too short', '123456'],
    ['too long', '1'.repeat(21)],
    ['letters', 'call 1234567'],
    ['ends in a separator', '123456-'],
    ['empty', ''],
  ])('rejects a number that is %s', (_label, value) => {
    expect(isPhoneNumber(value)).toBe(false);
  });

  it('accepts the longest allowed number (20 digits)', () => {
    expect(isPhoneNumber('1'.repeat(20))).toBe(true);
  });
});
