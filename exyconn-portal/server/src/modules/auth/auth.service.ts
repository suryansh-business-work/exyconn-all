import { UserModel } from '../admin/user.model';
import { verifyPassword, hashPassword, generateTempPassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { unauthenticated, badRequest, notFound } from '../../utils/errors';
import { imageUploader } from '../../utils/imagekit';
import { ROLES, type Role } from '../../constants/roles';
import { env } from '../../config/env';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';
import { isValidTimezone } from '../../utils/timezone';
import { canonicalLocale } from '../i18n/locale.constants';

export interface UpdateProfileInput {
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

/** Authentication logic (singleton). */
class AuthService {
  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) unauthenticated('Invalid email or password');
    if (user.isBlocked)
      unauthenticated('Your account is temporarily blocked. Contact an administrator.');
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) unauthenticated('Invalid email or password');

    const token = signToken({
      id: user.id,
      email: user.email,
      roles: user.roles as Role[],
    });
    return { token, user: user.toObject() };
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
    const update: Record<string, unknown> = {};
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

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 6) badRequest('New password must be at least 6 characters');
    const user = await UserModel.findById(id);
    if (!user) notFound('User');
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) badRequest('Current password is incorrect');
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
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
