import { randomUUID } from 'node:crypto';
import { emailer } from '../../src/modules/email';
import { authService } from '../../src/modules/auth/auth.service';
import {
  requestPasswordReset,
  resetIpLimiter,
  resetPassword,
  resetRequestLimiter,
} from '../../src/modules/auth/password-reset.service';
import { PasswordResetTokenModel } from '../../src/modules/auth/password-reset.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { AuditLogModel } from '../../src/modules/audit';
import { logger } from '../../src/utils/logger';
import { runAsPlatform } from '../../src/lib/tenant';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const send = emailer.send as jest.Mock;
const OLD_PASSWORD = `old-${randomUUID()}`;
const NEW_PASSWORD = `new-${randomUUID()}`;
/** A request with nothing about where it came from — an internal or test caller. */
const bare: GraphQLContext = { user: null };

const sentToken = (): string => {
  const link: string = send.mock.calls[0][0].variables.link;
  return new URL(link).searchParams.get('token') ?? '';
};

/** Lets the detached email send settle. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

let email: string;

beforeEach(async () => {
  await Promise.all([resetRequestLimiter.reset(), resetIpLimiter.reset()]);
  email = `${randomUUID()}@exyconn.com`;
  await seedUser(email, OLD_PASSWORD, [ROLES.EMPLOYEE]);
});

afterEach(() => jest.restoreAllMocks());

describe('asking for a reset link', () => {
  it('quietly ignores an address too long to be real', async () => {
    await expect(
      requestPasswordReset(`${'a'.repeat(260)}@exyconn.com`, bare),
    ).resolves.toBeUndefined();

    expect(send).not.toHaveBeenCalled();
    expect(await PasswordResetTokenModel.countDocuments()).toBe(0);
  });

  it('sends a link to a request that gives no address of its own, trimming the email', async () => {
    await expect(requestPasswordReset(`  ${email.toUpperCase()}  `, bare)).resolves.toBeUndefined();

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({
      to: email,
      variables: { expiresIn: '1 hour' },
      triggeredBy: 'password reset request',
    });
  });

  it('greets somebody with no name on file by their address', async () => {
    await runAsPlatform(() => UserModel.updateOne({ email }, { name: '' }));

    await requestPasswordReset(email, bare);

    expect(send.mock.calls[0][0].variables.name).toBe(email);
  });

  it('logs a failed send and still answers true', async () => {
    send.mockRejectedValueOnce(new Error('SMTP refused'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    await expect(requestPasswordReset(email, bare)).resolves.toBeUndefined();
    await settle();

    expect(logged).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      `Password reset email to ${email} failed`,
    );
  });

  it('limits a request with no address of its own under one shared key', async () => {
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);

    for (let attempt = 0; attempt < 11; attempt += 1) {
      await expect(
        requestPasswordReset(`${randomUUID()}@exyconn.com`, bare),
      ).resolves.toBeUndefined();
    }

    expect(warned).toHaveBeenCalledWith('Password reset from unknown rate-limited');
  });

  it('sends nothing for a deactivated account', async () => {
    await runAsPlatform(() => UserModel.updateOne({ email }, { isActive: false }));

    await expect(requestPasswordReset(email, bare)).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('using a reset link', () => {
  it('refuses a link that another request spent a moment earlier', async () => {
    await requestPasswordReset(email, bare);
    jest.spyOn(PasswordResetTokenModel, 'findOneAndUpdate').mockResolvedValueOnce(null);

    await expect(resetPassword(sentToken(), NEW_PASSWORD, bare)).rejects.toThrow(
      /invalid or has expired/,
    );
    await expect(authService.login(email, OLD_PASSWORD)).resolves.toHaveProperty('token');
  });

  it('refuses a password that contains the person s own address', async () => {
    await requestPasswordReset(email, bare);
    const local = email.split('@')[0];

    await expect(resetPassword(sentToken(), `x${local}x`, bare)).rejects.toThrow(
      'must not contain your email address',
    );
  });

  it('audits the reset with no address when the request carried none', async () => {
    await requestPasswordReset(email, bare);

    await expect(resetPassword(sentToken(), NEW_PASSWORD, bare)).resolves.toBe(true);

    const audit = await AuditLogModel.findOne({ action: 'PASSWORD_RESET' }).lean();
    expect(audit).toMatchObject({ module: 'Auth', ip: '', actorEmail: email });
  });
});
