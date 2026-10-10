import { isEmailAddress, isEmailShape } from '../../../src/utils/emailAddress';
import { MAX_EMAIL_LENGTH } from '../../../src/lib/rateLimiterSignIn';

const DOMAIN = '@acme.test';

describe('isEmailAddress', () => {
  it('accepts an ordinary address', () => {
    expect(isEmailAddress('asha.rao@acme.co')).toBe(true);
  });

  it.each([
    ['no @', 'asha.acme.test'],
    ['a space', 'asha rao@acme.test'],
    ['a one-letter top-level domain', 'asha@acme.t'],
    ['no domain dot', 'asha@acme'],
    ['two @ signs', 'a@b@acme.test'],
  ])('rejects an address with %s', (_label, value) => {
    expect(isEmailAddress(value)).toBe(false);
  });

  it('accepts an address exactly at the length cap and refuses one past it', () => {
    const atCap = `${'a'.repeat(MAX_EMAIL_LENGTH - DOMAIN.length)}${DOMAIN}`;
    expect(atCap).toHaveLength(MAX_EMAIL_LENGTH);
    expect(isEmailAddress(atCap)).toBe(true);
    expect(isEmailAddress(`a${atCap}`)).toBe(false);
  });

  it('exports the pattern every public form shares', () => {
    expect(isEmailShape('x@y.io')).toBe(true);
    expect(isEmailShape('x@y.i')).toBe(false);
  });
});
