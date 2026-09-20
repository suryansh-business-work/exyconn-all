import type { HydratedDocument } from 'mongoose';
import { UserModel, type UserDocument } from '../admin/user.model';
import {
  assertPasswordPolicy,
  verifyPassword,
  verifyAgainstNothing,
  hashPassword,
  generateTempPassword,
  needsRehash,
} from '../../utils/password';
import { signToken, signMfaChallenge, verifyMfaChallenge } from '../../utils/jwt';
import { unauthenticated, badRequest, notFound } from '../../utils/errors';
import { imageUploader } from '../../utils/imagekit';
import { ROLES, type Role } from '../../constants/roles';
import { env } from '../../config/env';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import { isValidTimezone } from '../../utils/timezone';
import { canonicalLocale } from '../i18n/locale.constants';
import { organizationOf, runAsPlatform, runForOrganizationOf } from '../../lib/tenant';
import {
  MAX_EMAIL_LENGTH,
  assertSignInAllowed,
  recordSignInFailure,
  recordSignInSuccess,
  signInAddress,
} from '../../lib/rateLimiterSignIn';
import { assertWorkspaceOpen } from './workspace-status';
import { startSession, revokeAllSessions } from './session.service';
import { mfaIsOn, verifySecondFactor } from './mfa.service';
import { profileDetailsUpdate, type ProfileDetailsInput } from './profile-details';

export interface UpdateProfileInput extends ProfileDetailsInput {
  name?: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
}

/** Shows enough of an address to recognise it without publishing it in full. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const head = local.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

const INVALID_CREDENTIALS = 'Invalid email or password';

type SignedInUser = HydratedDocument<UserDocument>;

/**
 * Retires every token issued to a person so far — portal sessions and tracker devices alike —
 * on their next request (buildContext compares the token's `tv` with this). Call it whenever
 * a password is set: a self-service change, an emailed reset, or an administrator's.
 */
export async function bumpTokenVersion(userId: string): Promise<void> {
  await runAsPlatform(() => UserModel.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } }));
  // The session rows go with them. Left behind they would sit in the person's own list as
  // live sign-ins that no longer work, which reads as "somebody else is still in my
  // account" — and it is folded in here so no caller of this can forget to do it.
  await revokeAllSessions(userId);
}

/** Replaces a legacy (bcrypt) or outdated hash with today's, now the plaintext is known good. */
async function upgradeHash(user: SignedInUser, password: string): Promise<void> {
  if (!needsRehash(user.passwordHash)) {
    return;
  }
  const passwordHash = await hashPassword(password);
  await runForOrganizationOf(organizationOf(user), () =>
    UserModel.updateOne({ _id: user._id }, { $set: { passwordHash } }),
  );
  user.passwordHash = passwordHash;
}

/**
 * Checks an email and password, for the portal sign-in and the tracker sign-in alike.
 *
 * Signing in happens BEFORE an organization is known, so the lookup runs as the platform: an
 * email address alone identifies a person, and their record says which company they are in.
 *
 * Nothing here tells a stranger whether an address has an account: an unknown address costs
 * the same password work as a known one, and a deactivated or blocked account answers with
 * the same "invalid" message unless the password was right. Wrong guesses are counted per
 * address and per IP (lib/rateLimiterSignIn).
 */
export async function verifyCredentials(
  email: string,
  password: string,
  ip: string,
): Promise<SignedInUser> {
  const address = signInAddress(email);
  await assertSignInAllowed(address, ip);
  const user =
    email.trim().length > MAX_EMAIL_LENGTH
      ? null
      : await runAsPlatform(() => UserModel.findOne({ email: address }));
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyAgainstNothing(password);
  if (!user || !ok) {
    await recordSignInFailure(address, ip);
    unauthenticated(INVALID_CREDENTIALS);
  }
  if (!user.isActive) {
    unauthenticated(INVALID_CREDENTIALS);
  }
  if (user.isBlocked) {
    unauthenticated('Your account is temporarily blocked. Contact an administrator.');
  }
  await recordSignInSuccess(address);
  await upgradeHash(user, password);
  return user;
}

/** Where a sign-in came from, recorded on the session it creates. */
export interface SignInFrom {
  ip: string;
  userAgent: string;
}

/**
 * What a sign-in that did not arrive over HTTP records — a test, or an internal caller. The
 * session row still exists, and reads as "unknown device" in the list, which is honest.
 */
const NOWHERE: SignInFrom = { ip: 'unknown', userAgent: '' };

/**
 * What a sign-in attempt produces: either a session, or a demand for a second factor.
 *
 * Both outcomes come back from one mutation rather than two, because the client cannot know
 * in advance which it will get — and it must not be able to find out by asking, since that
 * would tell a stranger which accounts have two-factor switched on.
 */
export interface LoginResult {
  token: string;
  user: Record<string, unknown> | null;
  mfaRequired: boolean;
  mfaChallenge: string;
}

/** Authentication logic (singleton). */
class AuthService {
  /**
   * Signs a person in to the portal (see verifyCredentials). A company that has been suspended
   * cannot be signed into at all. `ip` is the caller's address, which failed guesses count against.
   *
   * With two-factor on, the password alone buys only a five-minute challenge: no session row
   * is created, no token is issued and nothing about the account comes back.
   */
  async login(email: string, password: string, from: SignInFrom = NOWHERE): Promise<LoginResult> {
    const user = await verifyCredentials(email, password, from.ip);

    const organizationId = organizationOf(user);
    await assertWorkspaceOpen(organizationId);

    if (await mfaIsOn(user.id)) {
      return {
        token: '',
        user: null,
        mfaRequired: true,
        mfaChallenge: signMfaChallenge(user.id),
      };
    }
    return this.issueSession(user, from);
  }

  /**
   * Turns an identity that has been fully proved into a session — the last step of both the
   * one-factor and the two-factor path, so a session is recorded the same way whichever
   * door it came through.
   */
  async issueSession(user: SignedInUser, from: SignInFrom = NOWHERE): Promise<LoginResult> {
    const organizationId = organizationOf(user);
    const sessionId = await startSession({
      userId: user.id,
      userAgent: from.userAgent,
      ip: from.ip,
    });
    const token = signToken({
      id: user.id,
      email: user.email,
      roles: user.roles as Role[],
      organizationId,
      tv: user.tokenVersion ?? 0,
      sid: sessionId,
    });
    return { token, user: user.toObject(), mfaRequired: false, mfaChallenge: '' };
  }

  /**
   * The second half of a two-factor sign-in.
   *
   * The challenge says who; the code says it is still them. A wrong code counts against the
   * same per-address and per-IP limits a wrong password does, so the six digits cannot be
   * worked through at leisure.
   */
  async completeMfaSignIn(challenge: string, code: string, from: SignInFrom = NOWHERE) {
    const userId = verifyMfaChallenge(challenge);
    if (!userId) {
      unauthenticated('That sign-in has expired. Enter your password again.');
    }
    const user = await runAsPlatform(() => UserModel.findById(userId));
    if (!user?.isActive || user.isBlocked) {
      unauthenticated(INVALID_CREDENTIALS);
    }
    const address = signInAddress(user.email);
    await assertSignInAllowed(address, from.ip);
    if (!(await verifySecondFactor(user.id, code))) {
      await recordSignInFailure(address, from.ip);
      unauthenticated('That code is not right.');
    }
    await recordSignInSuccess(address);
    await assertWorkspaceOpen(organizationOf(user));
    return this.issueSession(user, from);
  }

  async me(id: string) {
    const user = await UserModel.findById(id).lean();
    if (!user) unauthenticated();
    return user;
  }

  /**
   * The person's own edits to their own record.
   *
   * Zone and language are theirs to change: HR picks a sensible one when the account is
   * created, but only the person knows where they actually are. An empty string clears the
   * choice back to the workspace default rather than storing a blank.
   */
  async updateProfile(id: string, input: UpdateProfileInput) {
    const update = profileDetailsUpdate(input);
    if (input.name !== undefined) update.name = input.name;
    if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl;
    if (input.timezone !== undefined) {
      const timezone = input.timezone.trim();
      if (timezone !== '' && !isValidTimezone(timezone)) {
        badRequest(`"${timezone}" is not a timezone this system knows.`);
      }
      update.timezone = timezone === '' ? null : timezone;
    }
    if (input.locale !== undefined) {
      const locale = input.locale.trim();
      const canonical = canonicalLocale(locale);
      if (locale !== '' && !canonical) {
        badRequest(`"${locale}" is not a language tag this system knows.`);
      }
      update.locale = locale === '' ? null : canonical;
    }
    const user = await UserModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!user) notFound('User');
    return user;
  }

  /**
   * Changes the caller's own password, then retires every token issued so far — including the
   * one this request came with, so the portal asks for the new password on its next request,
   * and every other browser and tracker device that knew the old one is signed out.
   */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await UserModel.findById(id);
    if (!user) notFound('User');
    assertPasswordPolicy(newPassword, user.email);
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) badRequest('Current password is incorrect');
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    await bumpTokenVersion(user.id);
    return true;
  }

  /**
   * Bootstrap/recovery for a portal with no administrator. Issues a fresh
   * temporary password on the configured seed-admin account and mails it to that
   * configured address — never to an address supplied by the caller.
   *
   * Unauthenticated by necessity (nobody can sign in to authorise it), so it is
   * a no-op the moment any ADMIN exists. That makes it useless both as a way to
   * reset a live administrator's password and as a mail-flooding endpoint.
   */
  async sendAdminCredentials(): Promise<string> {
    if (await UserModel.exists({ roles: ROLES.ADMIN })) {
      return 'An administrator already exists. Ask them to reset your password from Admin > Users.';
    }

    const email = env.seedAdmin.email.toLowerCase();
    const password = generateTempPassword();
    const passwordHash = await hashPassword(password);
    const existing = await UserModel.findOne({ email });

    if (existing) {
      existing.roles = Array.from(new Set([...existing.roles, ROLES.ADMIN])) as Role[];
      existing.passwordHash = passwordHash;
      existing.isActive = true;
      existing.isBlocked = false;
      await existing.save();
    } else {
      await UserModel.create({
        name: env.seedAdmin.name,
        email,
        passwordHash,
        roles: [ROLES.ADMIN],
        isActive: true,
      });
    }

    await mailer.sendCredentialsEmail({ name: env.seedAdmin.name, email, password });
    logger.warn(`Admin credentials re-issued and emailed to ${email}`);
    return `A new admin password has been emailed to ${maskEmail(email)}.`;
  }

  async uploadAvatar(id: string, file: string) {
    const url = await imageUploader.uploadAvatar(file, `avatar-${id}`);
    await UserModel.findByIdAndUpdate(id, { avatarUrl: url });
    return url;
  }
}

export const authService = new AuthService();
