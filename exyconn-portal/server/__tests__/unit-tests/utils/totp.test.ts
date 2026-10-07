import {
  TOTP_DIGITS,
  TOTP_PERIOD_SECONDS,
  decodeBase32,
  encodeBase32,
  generateTotpSecret,
  stepAt,
  totpCode,
  totpUri,
  verifyTotp,
} from '../../../src/utils/totp';

/** RFC 6238's SHA-1 seed, "12345678901234567890", as base32. */
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const at = (seconds: number) => new Date(seconds * 1000);

describe('base32', () => {
  it('encodes the RFC 6238 seed and RFC 4648 vectors', () => {
    expect(encodeBase32(Buffer.from('12345678901234567890'))).toBe(RFC_SECRET);
    expect(encodeBase32(Buffer.from('f'))).toBe('MY');
    expect(encodeBase32(Buffer.from('fo'))).toBe('MZXQ');
    expect(encodeBase32(Buffer.alloc(0))).toBe('');
  });

  it('decodes ignoring case, padding and spaces', () => {
    expect(decodeBase32('mzxq====').toString()).toBe('fo');
    expect(decodeBase32('GEZD GNBV GY3T QOJQ GEZD GNBV GY3T QOJQ').toString()).toBe(
      '12345678901234567890',
    );
  });

  it('refuses a character outside the alphabet', () => {
    expect(() => decodeBase32('ABC1')).toThrow('Not a base32 secret');
  });

  it('generates a 160-bit secret that round-trips', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(decodeBase32(secret)).toHaveLength(20);
    expect(generateTotpSecret()).not.toBe(secret);
  });
});

describe('totpCode', () => {
  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
  ])('matches the RFC 6238 vector at T=%i', (seconds, code) => {
    expect(totpCode(RFC_SECRET, stepAt(at(seconds)))).toBe(code);
  });

  it('uses the high word of a counter beyond 32 bits', () => {
    expect(totpCode(RFC_SECRET, 2 ** 32 + 1)).not.toBe(totpCode(RFC_SECRET, 1));
    expect(totpCode(RFC_SECRET, 2 ** 32 + 1)).toHaveLength(TOTP_DIGITS);
  });
});

describe('stepAt', () => {
  it('counts whole periods since the epoch', () => {
    expect(stepAt(at(0))).toBe(0);
    expect(stepAt(at(TOTP_PERIOD_SECONDS - 1))).toBe(0);
    expect(stepAt(at(TOTP_PERIOD_SECONDS))).toBe(1);
  });
});

describe('verifyTotp', () => {
  const now = at(59);

  it('accepts the current code, with spaces typed in it', () => {
    expect(verifyTotp(RFC_SECRET, '287082', now)).toBe(true);
    expect(verifyTotp(RFC_SECRET, '287 082', now)).toBe(true);
  });

  it('accepts the codes one step either side, and not two', () => {
    const step = stepAt(now);
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 1), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 1), now)).toBe(true);
    const twoAhead = totpCode(RFC_SECRET, step + 2);
    const nearby = [-1, 0, 1].map((drift) => totpCode(RFC_SECRET, step + drift));
    expect(nearby).not.toContain(twoAhead);
    expect(verifyTotp(RFC_SECRET, twoAhead, now)).toBe(false);
  });

  it('refuses a code of the wrong length', () => {
    expect(verifyTotp(RFC_SECRET, '28708', now)).toBe(false);
    expect(verifyTotp(RFC_SECRET, '2870820', now)).toBe(false);
  });

  it('refuses six characters whose bytes are longer than six', () => {
    expect(verifyTotp(RFC_SECRET, '28708é', now)).toBe(false);
  });

  it('checks against the current time when none is given', () => {
    const live = totpCode(RFC_SECRET, stepAt(new Date()));
    expect(verifyTotp(RFC_SECRET, live)).toBe(true);
  });
});

describe('totpUri', () => {
  it('writes the otpauth URI an authenticator reads', () => {
    const uri = totpUri({ secret: RFC_SECRET, account: 'asha@acme.test', issuer: 'Exyconn' });
    expect(uri.startsWith('otpauth://totp/Exyconn%3Aasha%40acme.test?')).toBe(true);
    const params = new URL(uri).searchParams;
    expect(params.get('secret')).toBe(RFC_SECRET);
    expect(params.get('issuer')).toBe('Exyconn');
    expect(params.get('algorithm')).toBe('SHA1');
    expect(params.get('digits')).toBe('6');
    expect(params.get('period')).toBe('30');
  });
});
