import { maskEmail } from '../../../src/utils/maskEmail';

describe('maskEmail', () => {
  it('keeps the first two characters of the local part and the whole domain', () => {
    expect(maskEmail('asha@acme.test')).toBe('as**@acme.test');
  });

  it('always hides at least one character, even for a two-letter local part', () => {
    expect(maskEmail('ab@acme.test')).toBe('ab*@acme.test');
  });

  it('masks a one-letter local part without revealing its length', () => {
    expect(maskEmail('a@acme.test')).toBe('a*@acme.test');
  });
});
