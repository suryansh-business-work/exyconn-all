import { generateTempPassword, hashPassword, verifyPassword } from '../../src/utils/password';

describe('password utils', () => {
  it('generates a 12-char password with mixed character classes', () => {
    const pw = generateTempPassword();
    expect(pw).toHaveLength(12);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[0-9]/);
    expect(pw).toMatch(/[!@#$%&*]/);
  });

  it('generates unique passwords across calls', () => {
    const set = new Set(Array.from({ length: 25 }, () => generateTempPassword()));
    expect(set.size).toBe(25);
  });

  it('hashes and verifies a generated password', async () => {
    const pw = generateTempPassword();
    const hash = await hashPassword(pw);
    expect(await verifyPassword(pw, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
