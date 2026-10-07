import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { authService, verifyCredentials } from '../../src/modules/auth/auth.service';
import { assertWorkspaceOpen } from '../../src/modules/auth/workspace-status';
import { confirmMfaEnrolment, startMfaEnrolment } from '../../src/modules/auth/mfa.service';
import { UserModel } from '../../src/modules/admin/user.model';
import { OrganizationModel } from '../../src/modules/organizations/organization.model';
import { hashPassword } from '../../src/utils/password';
import { signMfaChallenge, verifyToken } from '../../src/utils/jwt';
import { totpCode, stepAt } from '../../src/utils/totp';
import { organizationOf, runAsPlatform } from '../../src/lib/tenant';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';

const PASSWORD = `pw-${randomUUID()}`;
const FROM = { ip: '198.51.100.21', userAgent: 'Chrome on macOS' };
const INVALID = 'Invalid email or password';

const person = () => seedUser(`${randomUUID()}@exyconn.com`, PASSWORD, [ROLES.EMPLOYEE]);
const codeNow = (secret: string) => totpCode(secret, stepAt(new Date()));

describe('checking credentials', () => {
  it('answers an address too long to be real like any wrong password', async () => {
    const tooLong = `${'a'.repeat(250)}@exyconn.com`;

    await expect(verifyCredentials(tooLong, PASSWORD, FROM.ip)).rejects.toThrow(INVALID);
  });

  it('finds the account whatever case and spacing the address is typed in', async () => {
    const user = await person();

    const found = await verifyCredentials(`  ${user.email.toUpperCase()} `, PASSWORD, FROM.ip);

    expect(found.id).toBe(user.id);
  });
});

describe('a workspace that is open or not', () => {
  it('lets an account with no company through', async () => {
    await expect(assertWorkspaceOpen(null)).resolves.toBeUndefined();
  });

  it('refuses a company that does not exist', async () => {
    await expect(assertWorkspaceOpen(String(new Types.ObjectId()))).rejects.toThrow(
      'This workspace is suspended',
    );
  });

  it('signs in a platform account that belongs to no company', async () => {
    const email = `${randomUUID()}@exyconn.com`;
    await UserModel.create({
      name: 'Platform',
      email,
      passwordHash: await hashPassword(PASSWORD),
      roles: [ROLES.SUPER_ADMIN],
    });

    const result = await authService.login(email, PASSWORD, FROM);

    expect(result.mfaRequired).toBe(false);
    expect(verifyToken(result.token)?.organizationId ?? null).toBeNull();
  });
});

describe('finishing a two-factor sign-in', () => {
  it('refuses a challenge for an account that no longer exists', async () => {
    const challenge = signMfaChallenge(String(new Types.ObjectId()));

    await expect(authService.completeMfaSignIn(challenge, '123456', FROM)).rejects.toThrow(INVALID);
  });

  it('refuses a challenge for an account deactivated since the password was typed', async () => {
    const user = await person();
    await runAsPlatform(() => UserModel.updateOne({ _id: user.id }, { isActive: false }));

    await expect(
      authService.completeMfaSignIn(signMfaChallenge(user.id), '123456', FROM),
    ).rejects.toThrow(INVALID);
  });

  it('refuses a challenge for an account blocked since the password was typed', async () => {
    const user = await person();
    await runAsPlatform(() => UserModel.updateOne({ _id: user.id }, { isBlocked: true }));

    await expect(
      authService.completeMfaSignIn(signMfaChallenge(user.id), '123456', FROM),
    ).rejects.toThrow(INVALID);
  });

  it('refuses a right code once the company has been suspended', async () => {
    const user = await person();
    const { secret } = await startMfaEnrolment(user.id);
    await confirmMfaEnrolment(user.id, codeNow(secret));
    const { mfaChallenge } = await authService.login(user.email, PASSWORD, FROM);
    await runAsPlatform(() =>
      OrganizationModel.updateOne({ _id: organizationOf(user) }, { status: 'SUSPENDED' }),
    );

    await expect(
      authService.completeMfaSignIn(mfaChallenge, codeNow(secret), FROM),
    ).rejects.toThrow('This workspace is suspended');
  });

  it('refuses any code for an account that never switched two-factor on', async () => {
    const user = await person();

    await expect(
      authService.completeMfaSignIn(signMfaChallenge(user.id), '000000', FROM),
    ).rejects.toThrow('That code is not right.');
  });
});
