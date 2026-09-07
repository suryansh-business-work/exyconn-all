import { createHash, randomBytes } from 'node:crypto';
import { PasswordResetTokenModel } from './password-reset.model';
import { UserModel } from '../admin/user.model';
import { emailer } from '../email';
import { recordAudit } from '../audit';
import { hashPassword } from '../../utils/password';
import { badRequest } from '../../utils/errors';
import { createRateLimiter } from '../../utils/rateLimit';
import { portalOrigin } from '../../utils/portalOrigin';
import { logger } from '../../utils/logger';
import type { GraphQLContext } from '../../middleware/auth';

/** The template the link is emailed with. Authored in Tech → Email. */
export const PASSWORD_RESET_TEMPLATE = 'password-reset';

const HOUR_MS = 60 * 60 * 1000;
const TOKEN_TTL_MS = HOUR_MS;
const MAX_REQUESTS_PER_HOUR = 3;
/** Matches changePassword, so a reset cannot set a password sign-in would refuse to change to. */
const MIN_PASSWORD_LENGTH = 6;
const INVALID_LINK = 'This reset link is invalid or has expired. Request a new one.';

/** Per-address, so one stuck form cannot flood one inbox — and cannot probe the rest. */
export const resetRequestLimiter = createRateLimiter(HOUR_MS, MAX_REQUESTS_PER_HOUR);

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
  if (!resetRequestLimiter.allow(address)) {
    logger.warn(`Password reset for ${address} rate-limited`);
    return true;
  }
  const user = await UserModel.findOne({ email: address, isActive: true })
    .select('name email')
    .lean();
  if (!user) {
    return true;
  }

  const token = randomBytes(32).toString('hex');
  await PasswordResetTokenModel.create({
    userId: String(user._id),
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });
  const link = `${resetLinkOrigin(ctx.origin)}/reset-password?token=${token}`;

  try {
    await emailer.send({
      template: PASSWORD_RESET_TEMPLATE,
      to: user.email,
      variables: { name: user.name || user.email, link, expiresIn: '1 hour' },
      triggeredBy: 'password reset request',
    });
  } catch (error) {
    logger.error({ err: error }, `Password reset email to ${user.email} failed`);
  }
  return true;
}

/** Sets a new password from an emailed link. The link works once, and only for an hour. */
export async function resetPassword(
  token: string,
  newPassword: string,
  ctx: GraphQLContext,
): Promise<boolean> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    badRequest(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  const row = await PasswordResetTokenModel.findOne({ tokenHash: hashToken(token) });
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    badRequest(INVALID_LINK);
  }
  const user = await UserModel.findById(row.userId);
  if (!user) {
    badRequest(INVALID_LINK);
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  row.usedAt = new Date();
  await row.save();

  await recordAudit(ctx, {
    action: 'PASSWORD_RESET',
    module: 'Auth',
    entityId: user.id,
    entityLabel: user.email,
    summary: 'Reset own password from an emailed link',
    actor: { id: user.id, name: user.name, email: user.email },
  });
  return true;
}
