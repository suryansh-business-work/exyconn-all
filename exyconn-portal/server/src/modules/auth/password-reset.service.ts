import { createHash, randomBytes } from 'node:crypto';
import { PasswordResetTokenModel } from './password-reset.model';
import { UserModel } from '../admin/user.model';
import { emailer } from '../email';
import { recordAudit } from '../audit';
import { assertPasswordPolicy, hashPassword } from '../../utils/password';
import { badRequest } from '../../utils/errors';
import { createLimiter } from '../../lib/rateLimiter';
import { MAX_EMAIL_LENGTH } from '../../lib/rateLimiterSignIn';
import { bumpTokenVersion } from './auth.service';
import { portalOrigin } from '../../utils/portalOrigin';
import { logger } from '../../utils/logger';
import { organizationOf, runAsPlatform, runForOrganizationOf } from '../../lib/tenant';
import type { GraphQLContext } from '../../middleware/auth';

/** The template the link is emailed with. Authored in Tech → Email. */
export const PASSWORD_RESET_TEMPLATE = 'password-reset';

const HOUR_SEC = 60 * 60;
const TOKEN_TTL_MS = HOUR_SEC * 1000;
const INVALID_LINK = 'This reset link is invalid or has expired. Request a new one.';

/** Per-address, so one stuck form cannot flood one inbox — and cannot probe the rest. */
export const resetRequestLimiter = createLimiter({
  keyPrefix: 'reset_address',
  points: 3,
  durationSec: HOUR_SEC,
});

/** Per-IP, so one machine cannot walk a list of addresses three at a time. */
export const resetIpLimiter = createLimiter({
  keyPrefix: 'reset_ip',
  points: 10,
  durationSec: HOUR_SEC,
});

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The portal the emailed link opens. Shared with every other link the server mails out. */
export const resetLinkOrigin = portalOrigin;

/**
 * Starts a self-service reset. Always resolves true — a different answer for an unknown
 * address would tell a stranger which emails have accounts. The email itself is
 * best-effort: a failed send is logged, and the caller sees the same message either way.
 */
export async function requestPasswordReset(email: string, ctx: GraphQLContext): Promise<boolean> {
  const address = email.trim().toLowerCase();
  if (address.length > MAX_EMAIL_LENGTH) {
    return true;
  }
  if (!(await resetIpLimiter.allow(ctx.ip ?? 'unknown'))) {
    logger.warn(`Password reset from ${ctx.ip ?? 'unknown'} rate-limited`);
    return true;
  }
  if (!(await resetRequestLimiter.allow(address))) {
    logger.warn(`Password reset for ${address} rate-limited`);
    return true;
  }
  // Nobody is signed in, so the person is looked up platform-wide; their token and email
  // then belong to their own company (the template is that company's).
  const user = await runAsPlatform(() =>
    UserModel.findOne({ email: address, isActive: true })
      .select('name email organizationId')
      .lean(),
  );
  if (!user) {
    return true;
  }
  await runForOrganizationOf(organizationOf(user), () => sendResetLink(user, ctx));
  return true;
}

/**
 * Issues a fresh link and emails it. Only the newest link works: any earlier unused one is
 * spent as this one is issued, so an old email lying in an inbox cannot be used later.
 *
 * The send is not awaited — waiting on SMTP only for addresses that have an account would let
 * the response time say which addresses do.
 */
async function sendResetLink(
  user: { _id: unknown; name: string; email: string },
  ctx: GraphQLContext,
): Promise<void> {
  const userId = String(user._id);
  const token = randomBytes(32).toString('hex');
  await PasswordResetTokenModel.updateMany(
    { userId, usedAt: null },
    { $set: { usedAt: new Date() } },
  );
  await PasswordResetTokenModel.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });
  const link = `${resetLinkOrigin(ctx.origin)}/reset-password?token=${token}`;

  emailer
    .send({
      template: PASSWORD_RESET_TEMPLATE,
      to: user.email,
      variables: { name: user.name || user.email, link, expiresIn: '1 hour' },
      triggeredBy: 'password reset request',
    })
    .catch((error: unknown) => {
      logger.error({ err: error }, `Password reset email to ${user.email} failed`);
    });
}

/**
 * Sets a new password from an emailed link. The link works once, and only for an hour, and
 * every session and device signed in with the old password is signed out.
 *
 * The link is spent in the same write that finds it, so two requests racing with one link
 * cannot both set a password. The password rules are checked first, against the link's own
 * person, so a rejected password does not burn the link.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
  ctx: GraphQLContext,
): Promise<boolean> {
  // Nobody is signed in: the link and its person are found platform-wide, and the change is
  // then made and audited inside that person's company.
  const tokenHash = hashToken(token);
  const pending = await runAsPlatform(() =>
    PasswordResetTokenModel.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } })
      .select('userId')
      .lean(),
  );
  const user = pending ? await runAsPlatform(() => UserModel.findById(pending.userId)) : null;
  if (!user) {
    badRequest(INVALID_LINK);
  }
  assertPasswordPolicy(newPassword, user.email);
  const now = new Date();
  const spent = await runAsPlatform(() =>
    PasswordResetTokenModel.findOneAndUpdate(
      { tokenHash, usedAt: null, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
    ),
  );
  if (!spent) {
    badRequest(INVALID_LINK);
  }
  return runForOrganizationOf(organizationOf(user), async () => {
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    await bumpTokenVersion(user.id);

    await recordAudit(ctx, {
      action: 'PASSWORD_RESET',
      module: 'Auth',
      entityId: user.id,
      entityLabel: user.email,
      summary: 'Reset own password from an emailed link',
      actor: { id: user.id, name: user.name, email: user.email },
    });
    return true;
  });
}
