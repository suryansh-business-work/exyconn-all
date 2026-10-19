import {
  phonesMatch,
  phoneTailPattern,
  toPhoneKey,
} from '../../../../src/modules/google-maps/lead-phone';

describe('toPhoneKey', () => {
  it('reads an international number with its country code', () => {
    expect(toPhoneKey(' +91 20 1234 5678 ')).toEqual({ digits: '912012345678', international: true });
  });

  it('reads a 00 prefix as international', () => {
    expect(toPhoneKey('0091 20 1234 5678')).toEqual({ digits: '912012345678', international: true });
  });

  it('drops the leading zeros of a national number', () => {
    expect(toPhoneKey('020-1234-5678')).toEqual({ digits: '2012345678', international: false });
  });

  it('is null for a missing or too-short number', () => {
    expect(toPhoneKey(null)).toBeNull();
    expect(toPhoneKey(undefined)).toBeNull();
    expect(toPhoneKey('12 34 5')).toBeNull();
    expect(toPhoneKey('+1 234 56')).toBeNull();
  });
});

describe('phonesMatch', () => {
  it('matches two international numbers only on equal digits', () => {
    expect(phonesMatch('+91 20 1234 5678', '+91-20-12345678')).toBe(true);
    expect(phonesMatch('+91 20 1234 5678', '+44 20 1234 5678')).toBe(false);
  });

  it('matches two national numbers only on equal digits', () => {
    expect(phonesMatch('020 1234 5678', '(020) 12345678')).toBe(true);
    expect(phonesMatch('020 1234 5678', '020 1234 5679')).toBe(false);
  });

  it('matches a national number that is the tail of the international one, either way round', () => {
    expect(phonesMatch('+91 20 1234 5678', '020 1234 5678')).toBe(true);
    expect(phonesMatch('020 1234 5678', '+91 20 1234 5678')).toBe(true);
    expect(phonesMatch('021 1234 5678', '+91 20 1234 5678')).toBe(false);
  });

  it('never matches a number too short to compare', () => {
    expect(phonesMatch('123', '123')).toBe(false);
    expect(phonesMatch('+91 20 1234 5678', '')).toBe(false);
  });
});

describe('phoneTailPattern', () => {
  it('finds stored numbers ending in the same seven digits, however punctuated', () => {
    const key = toPhoneKey('+91 20 1234 5678');
    const pattern = phoneTailPattern(key ?? { digits: '', international: false });

    expect(pattern.test('020 123-45 678')).toBe(true);
    expect(pattern.test('+91 20 1234 5678 ')).toBe(true);
    expect(pattern.test('020 1234 5679')).toBe(false);
    expect(pattern.test('1234 5678 9')).toBe(false);
  });
});
