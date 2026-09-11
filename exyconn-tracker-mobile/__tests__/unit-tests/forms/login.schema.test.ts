import { describe, expect, it } from 'vitest';
import { loginSchema } from '../../../src/forms/login/login.schema';

function errorsOf(input: unknown): Record<string, string> {
  const result = loginSchema.safeParse(input);
  if (result.success) {
    return {};
  }
  // React Hook Form shows the FIRST issue per field, so that is the one worth asserting on.
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    errors[String(issue.path[0])] ??= issue.message;
  }
  return errors;
}

describe('loginSchema', () => {
  it('accepts portal credentials', () => {
    expect(errorsOf({ email: 'asha@exyconn.com', password: 'secret1', rememberMe: true })).toEqual(
      {},
    );
  });

  it('asks for both fields when they are empty', () => {
    expect(errorsOf({ email: '', password: '', rememberMe: false })).toEqual({
      email: 'Enter your email.',
      password: 'Enter your password.',
    });
  });

  it('rejects an address the portal would not recognise', () => {
    expect(errorsOf({ email: 'asha@', password: 'secret1', rememberMe: false }).email).toBe(
      'Enter a valid email.',
    );
  });

  it('holds passwords to the portal minimum', () => {
    expect(
      errorsOf({ email: 'asha@exyconn.com', password: '12345', rememberMe: false }).password,
    ).toBe('Passwords are at least 6 characters.');
  });

  it('trims the email before it is checked', () => {
    const parsed = loginSchema.parse({
      email: '  asha@exyconn.com ',
      password: 'secret1',
      rememberMe: false,
    });
    expect(parsed.email).toBe('asha@exyconn.com');
  });
});
