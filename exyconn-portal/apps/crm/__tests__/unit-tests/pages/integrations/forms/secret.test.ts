import { describe, expect, it } from 'vitest';
import {
  ACTIVE_OPTIONS,
  maskedToken,
  tokenField,
} from '../../../../../src/pages/integrations/forms/secret';

describe('tokenField', () => {
  it('requires a token on create, ignoring surrounding spaces', () => {
    const field = tokenField(false, 'Enter the token');

    expect(field.safeParse('  ').error?.issues[0]?.message).toBe('Enter the token');
    expect(field.parse('  abc  ')).toBe('abc');
  });

  it('lets an edit leave the token blank to keep the stored one', () => {
    expect(tokenField(true, 'Enter the token').parse('')).toBe('');
  });

  it('caps the token at 200 characters either way', () => {
    expect(tokenField(true, 'x').safeParse('a'.repeat(200)).success).toBe(true);
    expect(tokenField(false, 'x').safeParse('a'.repeat(201)).error?.issues[0]?.message).toBe(
      'That is too long',
    );
  });
});

describe('maskedToken', () => {
  it('shows the last characters the API gives', () => {
    expect(maskedToken(true, 'a1b2')).toBe('••••a1b2');
  });

  it('masks a stored token without a hint, and dashes a missing one', () => {
    expect(maskedToken(true, null)).toBe('••••');
    expect(maskedToken(false)).toBe('—');
  });
});

describe('ACTIVE_OPTIONS', () => {
  it('offers yes and no as the string values the select keeps', () => {
    expect(ACTIVE_OPTIONS.map((option) => option.value)).toEqual(['true', 'false']);
  });
});
