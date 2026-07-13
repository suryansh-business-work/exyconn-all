import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

const SALT_ROUNDS = 10;

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*';
const TEMP_PASSWORD_LENGTH = 12;

/** Returns a random character from the given alphabet. */
function pick(alphabet: string): string {
  return alphabet[randomInt(alphabet.length)];
}

/**
 * Generates a cryptographically random temporary password that always contains
 * at least one upper, lower, digit and symbol (satisfies the min-6 policy).
 */
export function generateTempPassword(): string {
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  while (required.length < TEMP_PASSWORD_LENGTH) {
    required.push(pick(all));
  }
  for (let i = required.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [required[i], required[j]] = [required[j], required[i]];
  }
  return required.join('');
}

/** Hashes a plaintext password. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Compares a plaintext password against a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
