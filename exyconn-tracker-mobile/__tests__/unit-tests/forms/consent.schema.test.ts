import { describe, expect, it } from 'vitest';
import { consentSchema } from '../../../src/forms/consent/consent.schema';

describe('consentSchema', () => {
  it('needs a typed name when the policy must be signed', () => {
    const result = consentSchema(true).safeParse({ signedName: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Type your full name to sign.');
  });

  it('does not take whitespace for a signature', () => {
    expect(consentSchema(true).safeParse({ signedName: '   ' }).success).toBe(false);
  });

  it('records the signature trimmed', () => {
    expect(consentSchema(true).parse({ signedName: '  Asha Rao ' }).signedName).toBe('Asha Rao');
  });

  it('asks for no name when the policy is only accepted', () => {
    expect(consentSchema(false).parse({ signedName: '' }).signedName).toBe('');
  });

  it('refuses anything that is not text', () => {
    expect(consentSchema(false).safeParse({ signedName: 42 }).success).toBe(false);
  });
});
