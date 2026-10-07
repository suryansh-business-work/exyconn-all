import { describe, expect, it } from 'vitest';
import { codeSchema, detailsSchema } from '../../../../../src/visitor/forms/demo-sign-in';

const messagesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('detailsSchema', () => {
  it('accepts a name and a work email, trimmed', () => {
    expect(detailsSchema.parse({ name: '  Asha Nair ', email: ' asha@example.com ' })).toEqual({
      name: 'Asha Nair',
      email: 'asha@example.com',
    });
  });

  it('requires both fields', () => {
    expect(messagesOf(detailsSchema.safeParse({ name: '   ', email: '' }))).toEqual(
      expect.arrayContaining(['Enter your name', 'Work email is required']),
    );
  });

  it('caps the name at 120 characters', () => {
    expect(
      messagesOf(detailsSchema.safeParse({ name: 'a'.repeat(121), email: 'a@example.com' })),
    ).toEqual(['Keep the name under 120 characters']);
    expect(detailsSchema.safeParse({ name: 'a'.repeat(120), email: 'a@example.com' }).success).toBe(
      true,
    );
  });

  it('rejects an address that is not an email', () => {
    expect(messagesOf(detailsSchema.safeParse({ name: 'Asha', email: 'asha@example' }))).toEqual([
      'Enter a valid email',
    ]);
  });
});

describe('codeSchema', () => {
  it.each(['123456', ' 654321 '])('accepts the six digits %j', (code) => {
    expect(codeSchema.safeParse({ code }).success).toBe(true);
  });

  it.each(['12345', '1234567', '12a456', ''])('rejects %j', (code) => {
    expect(messagesOf(codeSchema.safeParse({ code }))).toEqual([
      'Enter the six-digit code from the email',
    ]);
  });
});
