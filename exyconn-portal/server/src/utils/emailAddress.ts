import { MAX_EMAIL_LENGTH } from '../lib/rateLimiterSignIn';

/** Something@somewhere.tld, no spaces — the same shape every public form on the server accepts. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Whether a value is an email address a public form may store or send to. */
export function isEmailAddress(value: string): boolean {
  return value.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(value);
}
