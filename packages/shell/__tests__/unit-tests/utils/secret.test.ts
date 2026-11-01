import { describe, expect, it } from 'vitest';
import { env } from '@/config/env';
import { KEEP_SECRET_HINT, maskedSecret, secretField, webhookUrl } from '@/utils/secret';

const startsWithXoxb = {
  test: (value: string) => value.startsWith('xoxb-'),
  message: 'A bot token starts with xoxb-',
};

/** A typed value shaped like a token, built at runtime so no credential sits in the source. */
const token = (prefix: string) => `${prefix}${'1234'.repeat(3)}`;

describe('secretField', () => {
  it('requires a secret when creating, after trimming whitespace', () => {
    const schema = secretField(false, 'The token is required');
    expect(schema.safeParse('   ').error?.issues[0]?.message).toBe('The token is required');
    expect(schema.parse(` ${token('abc-')} `)).toBe(token('abc-'));
  });

  it('lets an edit leave the secret blank to keep the stored one', () => {
    expect(secretField(true, 'The token is required').parse('  ')).toBe('');
  });

  it('checks anything actually typed against the rule, and nothing left blank', () => {
    const schema = secretField(true, 'The token is required', startsWithXoxb);
    expect(schema.parse('')).toBe('');
    expect(schema.parse(token('xoxb-'))).toBe(token('xoxb-'));
    expect(schema.safeParse(token('xoxp-')).error?.issues[0]?.message).toBe(
      'A bot token starts with xoxb-',
    );
  });

  it('still requires the secret on create when a rule is given', () => {
    const schema = secretField(false, 'The token is required', startsWithXoxb);
    expect(schema.safeParse('').error?.issues[0]?.message).toBe('The token is required');
  });
});

describe('maskedSecret', () => {
  it('shows the last characters the API gives', () => {
    expect(maskedSecret(true, 'ab12')).toBe('••••ab12');
  });

  it('masks a stored secret with no hint, and dashes a missing one', () => {
    expect(maskedSecret(true, null)).toBe('••••');
    expect(maskedSecret(true)).toBe('••••');
    expect(maskedSecret(false, null)).toBe('—');
  });
});

describe('webhookUrl', () => {
  it("resolves a path against the API's own origin", () => {
    const url = new URL(webhookUrl('/webhooks/stripe'));
    expect(url.origin).toBe(new URL(env.graphqlUrl).origin);
    expect(url.pathname).toBe('/webhooks/stripe');
  });
});

describe('KEEP_SECRET_HINT', () => {
  it('tells an editor that blank keeps the current value', () => {
    expect(KEEP_SECRET_HINT).toBe('Leave blank to keep the current value');
  });
});
