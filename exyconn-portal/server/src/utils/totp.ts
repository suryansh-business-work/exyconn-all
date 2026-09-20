import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Time-based one-time passwords, RFC 6238, written out rather than pulled in.
 *
 * It is thirty lines of HMAC and a base32 alphabet, and every authenticator app in the
 * world already agrees on the parameters below. A dependency here would be a supply-chain
 * risk sitting directly on the sign-in path, for code shorter than its own README.
 */

/** The parameters every authenticator app assumes unless the URI says otherwise. */
export const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SECONDS = 30;
const ALGORITHM = 'sha1';

/**
 * How many steps either side of now are accepted.
 *
 * One, so a code typed as it rolls over is still taken, and a phone whose clock is half a
 * minute out still works. Wider would meaningfully extend the life of a code somebody
 * shoulder-surfed.
 */
const DRIFT_STEPS = 1;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** A shared secret, base32 as every authenticator expects it. 20 bytes = 160 bits. */
export function generateTotpSecret(): string {
  return encodeBase32(randomBytes(20));
}

export function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function decodeBase32(secret: string): Buffer {
  const clean = secret.replaceAll(/[\s=]/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const character of clean) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) {
      throw new Error('Not a base32 secret');
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** The code for one 30-second step. */
export function totpCode(secret: string, step: number): string {
  const counter = Buffer.alloc(8);
  counter.writeUInt32BE(Math.floor(step / 2 ** 32), 0);
  counter.writeUInt32BE(step >>> 0, 4);
  const digest = createHmac(ALGORITHM, decodeBase32(secret)).update(counter).digest();
  // The truncation RFC 4226 specifies: the last nibble picks where to read the code from.
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7f_ff_ff_ff;
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

/** The step `at` falls in. Exported so a test can drive time without waiting for it. */
export function stepAt(at: Date): number {
  return Math.floor(at.getTime() / 1000 / TOTP_PERIOD_SECONDS);
}

/**
 * Whether a typed code matches, allowing one step of clock drift either way.
 *
 * Compared with `timingSafeEqual`, so the check cannot be narrowed digit by digit from how
 * long it takes to fail.
 */
export function verifyTotp(secret: string, code: string, at = new Date()): boolean {
  const typed = code.replaceAll(/\s/g, '');
  if (typed.length !== TOTP_DIGITS) {
    return false;
  }
  const typedBuffer = Buffer.from(typed);
  const now = stepAt(at);
  for (let drift = -DRIFT_STEPS; drift <= DRIFT_STEPS; drift += 1) {
    const expected = Buffer.from(totpCode(secret, now + drift));
    if (expected.length === typedBuffer.length && timingSafeEqual(expected, typedBuffer)) {
      return true;
    }
  }
  return false;
}

/**
 * The `otpauth://` URI an authenticator app reads from a QR code.
 *
 * The issuer appears twice — in the label and as a parameter — because that is what the
 * apps expect, and it is what makes the entry read "Exyconn (asha@…)" rather than just an
 * address in a list of a dozen accounts.
 */
export function totpUri(input: { secret: string; account: string; issuer: string }): string {
  const label = encodeURIComponent(`${input.issuer}:${input.account}`);
  const parameters = new URLSearchParams({
    secret: input.secret,
    issuer: input.issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${parameters.toString()}`;
}
