import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  assertPasswordPolicy,
  generateTempPassword,
  hashPassword,
  needsRehash,
  verifyAgainstNothing,
  verifyPassword,
} from '../../../src/utils/password';

/** A password built at runtime, never a literal credential in source. */
const chosen = () => `${generateTempPassword()}Zz9!`;

describe('generateTempPassword', () => {
  it('is 12 characters with an upper, a lower, a digit and a symbol', () => {
    for (let i = 0; i < 20; i += 1) {
      const value = generateTempPassword();
      expect(value).toHaveLength(12);
      expect(value).toMatch(/[A-Z]/);
      expect(value).toMatch(/[a-z]/);
      expect(value).toMatch(/\d/);
      expect(value).toMatch(/[!@#$%&*]/);
    }
  });

  it('never uses characters that are easy to misread', () => {
    const sample = Array.from({ length: 30 }, generateTempPassword).join('');
    expect(sample).not.toMatch(/[IOlo01]/);
  });
});

describe('hashPassword and verifyPassword', () => {
  it('writes an argon2id hash that verifies only the right password', async () => {
    const plain = chosen();
    const hash = await hashPassword(plain);
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
    await expect(verifyPassword(`${plain}x`, hash)).resolves.toBe(false);
  });

  it.each(['$2a$', '$2b$', '$2y$'])(
    'verifies a legacy bcrypt hash written as %s',
    async (prefix) => {
      const plain = chosen();
      const legacy = bcrypt.hashSync(plain, 4);
      const hash = `${prefix}${legacy.slice(4)}`;
      await expect(verifyPassword(plain, hash)).resolves.toBe(true);
      await expect(verifyPassword(`${plain}x`, hash)).resolves.toBe(false);
    },
  );

  it('never verifies against something that is not a known hash', async () => {
    const plain = chosen();
    await expect(verifyPassword(plain, plain)).resolves.toBe(false);
    await expect(verifyPassword(plain, '')).resolves.toBe(false);
  });
});

describe('needsRehash', () => {
  it('flags a bcrypt or unknown hash for an upgrade', () => {
    expect(needsRehash(bcrypt.hashSync(chosen(), 4))).toBe(true);
    expect(needsRehash('plain')).toBe(true);
  });

  it('keeps a current argon2id hash and replaces a weaker one', async () => {
    expect(needsRehash(await hashPassword(chosen()))).toBe(false);
    const weaker = await argon2.hash(chosen(), {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 1,
      parallelism: 1,
    });
    expect(needsRehash(weaker)).toBe(true);
  });
});

describe('verifyAgainstNothing', () => {
  it('always answers false, and reuses its dummy hash on later calls', async () => {
    const hashSpy = jest.spyOn(argon2, 'hash');
    await expect(verifyAgainstNothing(chosen())).resolves.toBe(false);
    await expect(verifyAgainstNothing(chosen())).resolves.toBe(false);
    expect(hashSpy).toHaveBeenCalledTimes(1);
    hashSpy.mockRestore();
  });
});

describe('assertPasswordPolicy', () => {
  const email = 'priya.sharma@acme.test';

  it('accepts a password between the limits', () => {
    expect(() => assertPasswordPolicy('x'.repeat(PASSWORD_MIN_LENGTH), email)).not.toThrow();
    expect(() => assertPasswordPolicy('x'.repeat(PASSWORD_MAX_LENGTH), email)).not.toThrow();
  });

  it('refuses one shorter than the minimum', () => {
    expect(() => assertPasswordPolicy('x'.repeat(PASSWORD_MIN_LENGTH - 1), email)).toThrow(
      `at least ${PASSWORD_MIN_LENGTH} characters`,
    );
  });

  it('refuses one longer than the maximum', () => {
    expect(() => assertPasswordPolicy('x'.repeat(PASSWORD_MAX_LENGTH + 1), email)).toThrow(
      `at most ${PASSWORD_MAX_LENGTH} characters`,
    );
  });

  it('refuses one containing the email local part, in any case', () => {
    expect(() => assertPasswordPolicy('xxPRIYA.SHARMAxx', email)).toThrow(
      'must not contain your email address',
    );
  });

  it('does not check a local part shorter than three characters', () => {
    expect(() => assertPasswordPolicy('ab-something-long', 'ab@acme.test')).not.toThrow();
    expect(() => assertPasswordPolicy('abc-something-long', 'abc@acme.test')).toThrow(
      'must not contain your email address',
    );
  });
});
