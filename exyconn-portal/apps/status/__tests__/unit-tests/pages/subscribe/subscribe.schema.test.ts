import { describe, expect, it } from 'vitest';
import {
  SUBSCRIBE_DEFAULTS,
  subscribeSchema,
} from '../../../../src/pages/subscribe/forms/subscribe';

const messages = (email: string) => {
  const result = subscribeSchema.safeParse({ email });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('subscribeSchema', () => {
  it('starts empty, which is not yet a valid address', () => {
    expect(SUBSCRIBE_DEFAULTS).toEqual({ email: '' });
    expect(messages(SUBSCRIBE_DEFAULTS.email)).toContain('Enter your email address');
  });

  it('trims the address it accepts', () => {
    expect(subscribeSchema.parse({ email: '  ada@example.com ' })).toEqual({
      email: 'ada@example.com',
    });
  });

  it('accepts an address of exactly 200 characters and refuses 201', () => {
    const domain = '@example.com';
    expect(messages(`${'a'.repeat(200 - domain.length)}${domain}`)).toEqual([]);
    expect(messages(`${'a'.repeat(201 - domain.length)}${domain}`)).toEqual([
      'That address is too long',
    ]);
  });

  it('refuses a malformed address', () => {
    expect(messages('ada@example')).toEqual(['Enter a valid email address']);
  });
});
