import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { badRequest } from './errors';

/**
 * Argon2id at OWASP's recommended minimum (19 MiB, 2 iterations, 1 lane). New hashes are
 * always argon2id; bcrypt is kept only to verify the hashes written before the switch, which
 * are upgraded the next time their owner signs in (see `needsRehash`).
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

const ARGON2_PREFIX = '$argon2';
const BCRYPT_PREFIXES = ['$2a$', '$2b$', '$2y$'];

/** Long enough to resist guessing, short enough that hashing cannot be used to burn CPU. */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
/** A local part this short ("a@…") would reject half of all passwords, so it is not checked. */
const MIN_CHECKED_LOCAL_PART = 3;

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
 * at least one upper, lower, digit and symbol.
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

/** Hashes a plaintext password with argon2id. */
export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

/**
 * Compares a plaintext password against a stored hash — argon2 for anything written now,
 * bcrypt for a hash from before the switch. An unrecognised hash never verifies.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (hash.startsWith(ARGON2_PREFIX)) {
    return argon2.verify(hash, plain);
  }
  if (BCRYPT_PREFIXES.some((prefix) => hash.startsWith(prefix))) {
    return bcrypt.compare(plain, hash);
  }
  return false;
}

/**
 * Whether a stored hash should be replaced after a successful sign-in: any legacy bcrypt
 * hash, or an argon2 hash made with weaker parameters than today's.
 */
export function needsRehash(hash: string): boolean {
  if (!hash.startsWith(ARGON2_PREFIX)) {
    return true;
  }
  return argon2.needsRehash(hash, ARGON2_OPTIONS);
}

let dummyHash: Promise<string> | null = null;

/**
 * Spends the time a real verification would when there is no account to verify against, so
 * "no such email" and "wrong password" take the same time and cannot be told apart.
 */
export async function verifyAgainstNothing(plain: string): Promise<false> {
  dummyHash ??= hashPassword(generateTempPassword());
  await argon2.verify(await dummyHash, plain);
  return false;
}

/**
 * The password rules every place a person chooses a password applies: self-service change,
 * an emailed reset, and an administrator setting one. Seeding and generated temporary
 * passwords hash directly and do not come through here.
 */
export function assertPasswordPolicy(password: string, email: string): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    badRequest(`New password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    badRequest(`New password must be at most ${PASSWORD_MAX_LENGTH} characters`);
  }
  const localPart = (email.split('@')[0] ?? '').toLowerCase();
  if (localPart.length >= MIN_CHECKED_LOCAL_PART && password.toLowerCase().includes(localPart)) {
    badRequest('New password must not contain your email address');
  }
}
