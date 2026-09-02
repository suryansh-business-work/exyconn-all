import { UserModel } from '../modules/admin/user.model';
import { ROLES, type Role } from '../constants/roles';
import { hashPassword } from '../utils/password';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Guarantees the portal stays administrable. Runs on every boot, but only acts
 * when NO user holds ADMIN — a fresh database gets the configured admin, and a
 * database that lost every administrator (role edited away, account deleted)
 * gets it back on the seed account. Because it is a no-op whenever any admin
 * exists, it never fights a deliberate change made by a real administrator.
 */
export async function ensureAdminAccess(): Promise<void> {
  if (await UserModel.exists({ roles: ROLES.ADMIN })) return;

  const email = env.seedAdmin.email.toLowerCase();
  const existing = await UserModel.findOne({ email });

  if (existing) {
    existing.roles = Array.from(new Set([...existing.roles, ROLES.ADMIN])) as Role[];
    existing.isActive = true;
    existing.isBlocked = false;
    await existing.save();
    logger.warn(`No ADMIN user existed — restored the ADMIN role on ${email}`);
    return;
  }

  await UserModel.create({
    name: env.seedAdmin.name,
    email,
    passwordHash: await hashPassword(env.seedAdmin.password),
    roles: [ROLES.ADMIN],
    isActive: true,
  });
  logger.warn(`No ADMIN user existed — created the seed ADMIN ${email}`);
}
