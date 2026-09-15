import bcrypt from 'bcryptjs';
import { authService } from '../../src/modules/auth/auth.service';
import { UserModel } from '../../src/modules/admin/user.model';
import {
  assertPasswordPolicy,
  hashPassword,
  needsRehash,
  verifyPassword,
} from '../../src/utils/password';
import { ROLES } from '../../src/constants/roles';
import { runAsPlatform } from '../../src/lib/tenant';
import { seedUser } from '../helpers';

const PASSWORD = process.env.TEST_SECURITY_PASSWORD ?? 'Correct@Horse1';
const EMAIL = 'hash@exyconn.com';

describe('password hashing', () => {
  it('writes argon2id hashes that verify, and do not need rehashing', async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).toContain('m=19456,p=1,t=2');
    await expect(verifyPassword(PASSWORD, hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
    expect(needsRehash(hash)).toBe(false);
  });

  it('still verifies a legacy bcrypt hash, and flags it for an upgrade', async () => {
    const legacy = await bcrypt.hash(PASSWORD, 4);

    await expect(verifyPassword(PASSWORD, legacy)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', legacy)).resolves.toBe(false);
    expect(needsRehash(legacy)).toBe(true);
  });

  it('never verifies against something that is not a hash', async () => {
    await expect(verifyPassword(PASSWORD, PASSWORD)).resolves.toBe(false);
  });

  it('upgrades a bcrypt hash to argon2id on a successful sign-in', async () => {
    const user = await seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);
    const legacy = await bcrypt.hash(PASSWORD, 4);
    await runAsPlatform(() =>
      UserModel.updateOne({ _id: user._id }, { $set: { passwordHash: legacy } }),
    );

    await expect(authService.login(EMAIL, PASSWORD)).resolves.toHaveProperty('token');

    const stored = await runAsPlatform(() => UserModel.findById(user._id).lean());
    expect(stored?.passwordHash.startsWith('$argon2id$')).toBe(true);
    await expect(authService.login(EMAIL, PASSWORD)).resolves.toHaveProperty('token');
  });
});

describe('password policy', () => {
  it('accepts a long enough password', () => {
    expect(() => assertPasswordPolicy('Tr0ub4dor&3x', 'jane@exyconn.com')).not.toThrow();
  });

  it('refuses one that is too short or too long', () => {
    expect(() => assertPasswordPolicy('Short@1', 'jane@exyconn.com')).toThrow(/at least 10/);
    expect(() => assertPasswordPolicy('x'.repeat(129), 'jane@exyconn.com')).toThrow(/at most 128/);
  });

  it('refuses one that contains the email address’s local part, in any case', () => {
    expect(() => assertPasswordPolicy('MyJaneSmith2024', 'janesmith@exyconn.com')).toThrow(
      /must not contain your email/,
    );
  });

  it('is applied when a person changes their own password', async () => {
    const user = await seedUser(EMAIL, PASSWORD, [ROLES.EMPLOYEE]);

    await expect(authService.changePassword(user.id, PASSWORD, 'short')).rejects.toThrow(
      /at least 10/,
    );
    await expect(authService.changePassword(user.id, PASSWORD, 'hash-Secret-99')).rejects.toThrow(
      /must not contain your email/,
    );
  });
});
