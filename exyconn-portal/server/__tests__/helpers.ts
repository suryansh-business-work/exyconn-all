import { UserModel } from '../src/modules/admin/user.model';
import { hashPassword } from '../src/utils/password';
import type { Role } from '../src/constants/roles';

/**
 * Inserts a user directly with a known password — used by tests that need to log
 * in (adminService.createUser auto-generates the password and emails it).
 */
export async function seedUser(email: string, password: string, roles: Role[]) {
  const passwordHash = await hashPassword(password);
  return UserModel.create({
    name: email.split('@')[0],
    email,
    passwordHash,
    roles,
    isActive: true,
  });
}
