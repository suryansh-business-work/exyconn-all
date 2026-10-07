import { describe, expect, it } from 'vitest';
import { codeSchema, emailSchema } from '../../../../../src/auth/forms/client-sign-in';

const firstMessage = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('emailSchema', () => {
  it('accepts a work email and trims the spaces around it', () => {
    const result = emailSchema.safeParse({ email: '  ada@acme.com ' });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('ada@acme.com');
  });

  it('requires an email', () => {
    expect(firstMessage(emailSchema.safeParse({ email: '   ' }))).toBe('Email is required');
  });

  it('rejects something that is not an email', () => {
    expect(firstMessage(emailSchema.safeParse({ email: 'ada@acme' }))).toBe('Enter a valid email');
  });
});

describe('codeSchema', () => {
  it('accepts six digits, trimmed', () => {
    expect(codeSchema.safeParse({ code: ' 123456 ' }).data?.code).toBe('123456');
  });

  it.each(['12345', '1234567', '12a456', ''])('rejects %j', (code) => {
    expect(firstMessage(codeSchema.safeParse({ code }))).toBe(
      'Enter the six-digit code from the email',
    );
  });
});
