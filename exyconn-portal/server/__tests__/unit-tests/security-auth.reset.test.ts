import { emailer } from '../../src/modules/email';
import { authService } from '../../src/modules/auth/auth.service';
import { requestPasswordReset, resetPassword } from '../../src/modules/auth/password-reset.service';
import { PasswordResetTokenModel } from '../../src/modules/auth/password-reset.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { env } from '../../src/config/env';
import { ROLES } from '../../src/constants/roles';
import { runAsPlatform } from '../../src/lib/tenant';
import type { GraphQLContext } from '../../src/middleware/auth';
import { seedUser } from '../helpers';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const send = emailer.send as jest.Mock;
const EMAIL = 'reset@exyconn.com';
const OLD_PASSWORD = process.env.TEST_SECURITY_PASSWORD ?? 'Correct@Horse1';
const NEW_PASSWORD = process.env.TEST_RESET_PASSWORD ?? 'Fresh@45678';
const ctx = (ip = '10.0.0.9'): GraphQLContext => ({ user: null, ip, origin: env.corsOrigins[0] });

/** The token carried by the Nth link emailed so far. */
function tokenFromEmail(index: number): string {
  const link: string = send.mock.calls[index][0].variables.link;
  return new URL(link).searchParams.get('token') ?? '';
}

describe('password reset hardening', () => {
  beforeEach(async () => {
    await seedUser(EMAIL, OLD_PASSWORD, [ROLES.FINANCE]);
  });

  it('spends an earlier link as soon as a newer one is issued', async () => {
    await requestPasswordReset(EMAIL, ctx());
    await requestPasswordReset(EMAIL, ctx());

    await expect(resetPassword(tokenFromEmail(0), NEW_PASSWORD, ctx())).rejects.toThrow(
      /invalid or has expired/,
    );
    await expect(resetPassword(tokenFromEmail(1), NEW_PASSWORD, ctx())).resolves.toBe(true);
  });

  it('sets a password only once when the same link is used twice at the same moment', async () => {
    await requestPasswordReset(EMAIL, ctx());
    const token = tokenFromEmail(0);

    const results = await Promise.allSettled([
      resetPassword(token, NEW_PASSWORD, ctx()),
      resetPassword(token, 'Other-Pass-777', ctx()),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  });

  it('retires every token issued before the reset', async () => {
    await requestPasswordReset(EMAIL, ctx());
    await resetPassword(tokenFromEmail(0), NEW_PASSWORD, ctx());

    const user = await runAsPlatform(() => UserModel.findOne({ email: EMAIL }).lean());
    expect(user?.tokenVersion).toBe(1);
    await expect(authService.login(EMAIL, NEW_PASSWORD)).resolves.toHaveProperty('token');
  });

  it('limits one IP walking through many addresses', async () => {
    for (let index = 0; index < 11; index += 1) {
      await requestPasswordReset(
        index === 10 ? EMAIL : `other${index}@exyconn.com`,
        ctx('10.9.9.9'),
      );
    }

    expect(send).not.toHaveBeenCalled();
    await requestPasswordReset(EMAIL, ctx('10.9.9.10'));
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('expires links in the database, through a TTL index', () => {
    expect(PasswordResetTokenModel.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 })],
      ]),
    );
  });
});
