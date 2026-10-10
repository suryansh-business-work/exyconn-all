import { MAX_EMAIL_LENGTH } from '../lib/rateLimiterSignIn';

/**
 * Something@somewhere.tld, no spaces — the same shape every public form on the server accepts.
 * Read as `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` but checked without a regex, whose two overlapping
 * `[^\s@]` runs backtrack quadratically on a long string of dots.
 */
export function isEmailShape(value: string): boolean {
  const at = value.indexOf('@');
  if (at < 1 || at !== value.lastIndexOf('@') || /\s/.test(value)) {
    return false;
  }
  const domain = value.slice(at + 1);
  const dot = domain.indexOf('.', 1);
  return dot >= 1 && dot <= domain.length - 3;
}

/** Whether a value is an email address a public form may store or send to. */
export function isEmailAddress(value: string): boolean {
  return value.length <= MAX_EMAIL_LENGTH && isEmailShape(value);
}
