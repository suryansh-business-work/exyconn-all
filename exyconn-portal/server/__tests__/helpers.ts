import { UserModel } from '../src/modules/admin/user.model';
import { OrganizationModel } from '../src/modules/organizations';
import { hashPassword } from '../src/utils/password';
import { runAsPlatform } from '../src/lib/tenant';
import type { Role } from '../src/constants/roles';

/**
 * The company every seeded person belongs to, as they do in a real install: a request
 * confines itself to the signed-in person's organization, and somebody who is in none can
 * read nothing at all.
 */
export async function seedOrganization(name = 'Test Co') {
  const slug = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
  const existing = await runAsPlatform(() => OrganizationModel.findOne({ slug }));
  return (
    existing ??
    (await runAsPlatform(() => OrganizationModel.create({ name, slug, currency: 'USD' })))
  );
}

/**
 * Inserts a user directly with a known password — used by tests that need to log
 * in (adminService.createUser auto-generates the password and emails it).
 */
export async function seedUser(email: string, password: string, roles: Role[]) {
  const passwordHash = await hashPassword(password);
  const organization = await seedOrganization();
  return UserModel.create({
    name: email.split('@')[0],
    email,
    passwordHash,
    roles,
    isActive: true,
    organizationId: organization._id,
  });
}
