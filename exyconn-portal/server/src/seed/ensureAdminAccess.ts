import { UserModel } from '../modules/admin/user.model';
import { ROLES, type Role } from '../constants/roles';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Keeps the configured bootstrap account able to administer the portal AND the platform it
 * runs on. Runs on every boot: creates it on a fresh database, and re-grants ADMIN and
 * SUPER_ADMIN (plus un-blocks and re-activates it) whenever something has taken that away.
 *
 * SUPER_ADMIN is what creates the first company and appoints its administrator; ADMIN is what
 * administers the company this account itself belongs to, once it has one.
 *
 * This one account is deliberately not demotable — an edit in Admin > Users that
 * strips its ADMIN role is exactly how the portal previously ended up with
 * nobody able to administer it. Every other user's roles are left alone, and no
 * existing password is ever overwritten.
 */
export async function ensureAdminAccess(): Promise<void> {
  const email = env.seedAdmin.email.toLowerCase();
  const existing = await UserModel.findOne({ email });

  if (!existing) {
    await UserModel.create({
      name: env.seedAdmin.name,
      email,
      passwordHash: await hashPassword(env.seedAdmin.password),
      roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      isActive: true,
    });
    logger.warn(`Created the bootstrap ADMIN account ${email}`);
    return;
  }

  const canAdminister =
    existing.roles.includes(ROLES.ADMIN) &&
    existing.roles.includes(ROLES.SUPER_ADMIN) &&
    existing.isActive &&
    !existing.isBlocked;
  if (canAdminister) return;

  existing.roles = Array.from(
    new Set([...existing.roles, ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  ) as Role[];
  existing.isActive = true;
  existing.isBlocked = false;
  await existing.save();
  logger.warn(`Restored ADMIN access on the bootstrap account ${email}`);
}
