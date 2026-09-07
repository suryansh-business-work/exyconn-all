import { emailer } from '../../src/modules/email';
import { authService } from '../../src/modules/auth/auth.service';
import {
  requestPasswordReset,
  resetLinkOrigin,
  resetPassword,
  resetRequestLimiter,
} from '../../src/modules/auth/password-reset.service';
import { PasswordResetTokenModel } from '../../src/modules/auth/password-reset.model';
import { AuditLogModel } from '../../src/modules/audit';
import { env } from '../../src/config/env';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

// The templated emailer needs SMTP and a stored template; capture the link instead.
jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const send = emailer.send as jest.Mock;
const EMAIL = 'jane@exyconn.com';
const OLD_PASSWORD = 'Secret@123';
const NEW_PASSWORD = 'Fresh@456';
const ctx: GraphQLContext = { user: null, ip: '10.0.0.9', origin: env.corsOrigins[0] };

/** The token the emailed link carries — the only place it exists in plaintext. */
function sentToken(): string {
  const link: string = send.mock.calls[0][0].variables.link;
  return new URL(link).searchParams.get('token') ?? '';
}

beforeEach(async () => {
  resetRequestLimiter.reset();
  await seedUser(EMAIL, OLD_PASSWORD, [ROLES.FINANCE]);
});

describe('self-service password reset', () => {
  it('emails a link to the portal that asked and resets the password once', async () => {
    await expect(requestPasswordReset(EMAIL, ctx)).resolves.toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toMatchObject({ template: 'password-reset', to: EMAIL });
    expect(send.mock.calls[0][0].variables.link).toMatch(
      new RegExp(`^${env.corsOrigins[0]}/reset-password\\?token=`),
    );

    const token = sentToken();
    await expect(resetPassword(token, NEW_PASSWORD, ctx)).resolves.toBe(true);
    await expect(authService.login(EMAIL, NEW_PASSWORD)).resolves.toHaveProperty('token');
    await expect(authService.login(EMAIL, OLD_PASSWORD)).rejects.toThrow('Invalid email');

    const audit = await AuditLogModel.findOne({ action: 'PASSWORD_RESET' }).lean();
    expect(audit).toMatchObject({ actorEmail: EMAIL, entityLabel: EMAIL, ip: '10.0.0.9' });

    // Single use: the same link cannot set a second password.
    await expect(resetPassword(token, 'Another@789', ctx)).rejects.toThrow(
      /invalid or has expired/,
    );
  });

  it('rejects an expired link', async () => {
    await requestPasswordReset(EMAIL, ctx);
    await PasswordResetTokenModel.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    await expect(resetPassword(sentToken(), NEW_PASSWORD, ctx)).rejects.toThrow(
      /invalid or has expired/,
    );
    await expect(authService.login(EMAIL, OLD_PASSWORD)).resolves.toHaveProperty('token');
  });

  it('rejects an unknown token and a short password', async () => {
    await expect(resetPassword('not-a-token', NEW_PASSWORD, ctx)).rejects.toThrow(
      /invalid or has expired/,
    );
    await expect(resetPassword('not-a-token', 'abc', ctx)).rejects.toThrow(/at least 6/);
  });

  it('answers true for an unknown address and sends nothing', async () => {
    await expect(requestPasswordReset('nobody@exyconn.com', ctx)).resolves.toBe(true);
    expect(send).not.toHaveBeenCalled();
    expect(await PasswordResetTokenModel.countDocuments()).toBe(0);
  });

  it('sends at most three links an hour per address', async () => {
    for (let i = 0; i < 4; i += 1) {
      await expect(requestPasswordReset(EMAIL, ctx)).resolves.toBe(true);
    }
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('links back only to an origin CORS trusts', () => {
    expect(resetLinkOrigin(env.corsOrigins[0])).toBe(env.corsOrigins[0]);
    expect(resetLinkOrigin('https://evil.example')).toBe(env.portalHubUrl);
    expect(resetLinkOrigin(undefined)).toBe(env.portalHubUrl);
  });
});
