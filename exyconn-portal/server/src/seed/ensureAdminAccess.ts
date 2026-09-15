import { UserModel } from '../modules/admin/user.model';
import { ROLES, type Role } from '../constants/roles';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/** Creates the bootstrap account on a database that has none, or explains why it cannot. */
async function createBootstrapAccount(email: string): Promise<void> {
  const { password } = env.seedAdmin;
  if (password === null) {
    // A default password would be one everybody who has read this repository knows.
    const anyAdmin = await UserModel.exists({ roles: ROLES.ADMIN });
    if (!anyAdmin) {
      logger.error(
        `No administrator exists and SEED_ADMIN_PASSWORD is not set, so the bootstrap account ${email} was not created. Set SEED_ADMIN_PASSWORD and restart.`,
      );
    }
    return;
  }
  await UserModel.create({
    name: env.seedAdmin.name,
    email,
    passwordHash: await hashPassword(password),
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    isActive: true,
  });
  logger.warn(`Created the bootstrap ADMIN account ${email}`);
}

/**
 * Keeps the configured bootstrap account able to administer the portal AND the platform it
 * runs on. Runs on every boot: creates it on a fresh database, and re-grants ADMIN and
 * SUPER_ADMIN whenever something has taken them away.
 *
 * SUPER_ADMIN is what creates the first company and appoints its administrator; ADMIN is what
 * administers the company this account itself belongs to, once it has one.
 *
 * This one account is deliberately not demotable — an edit in Admin > Users that
 * strips its ADMIN role is exactly how the portal previously ended up with
 * nobody able to administer it. Every other user's roles are left alone, and no
 * existing password is ever overwritten.
 *
 * The guarantee only holds when SEED_ADMIN_PASSWORD is configured: without it nothing is
 * created and nothing is re-granted. A blocked or deactivated bootstrap account is never
 * switched back on — somebody blocked it on purpose, and undoing that on the next restart
 * would make blocking a compromised administrator impossible.
 */
export async function ensureAdminAccess(): Promise<void> {
  const email = env.seedAdmin.email.toLowerCase();
  const existing = await UserModel.findOne({ email });

  if (!existing) {
    await createBootstrapAccount(email);
    return;
  }
  if (env.seedAdmin.password === null) return;

  if (existing.isBlocked || !existing.isActive) {
    logger.warn(`The bootstrap account ${email} is blocked or inactive; leaving it that way`);
  }
  const canAdminister =
    existing.roles.includes(ROLES.ADMIN) && existing.roles.includes(ROLES.SUPER_ADMIN);
  if (canAdminister) return;

  existing.roles = Array.from(
    new Set([...existing.roles, ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  ) as Role[];
  await existing.save();
  logger.warn(`Restored ADMIN access on the bootstrap account ${email}`);
}
