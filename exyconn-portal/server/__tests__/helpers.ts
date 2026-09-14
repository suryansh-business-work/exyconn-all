import { Types } from 'mongoose';
import { UserModel } from '../src/modules/admin/user.model';
import { OrganizationModel } from '../src/modules/organizations';
import { hashPassword } from '../src/utils/password';
import { runAsPlatform, setDefaultScope } from '../src/lib/tenant';
import type { TaxSystem } from '../src/modules/organizations/organization.model';
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

/** What a suite can say about the company it runs as. */
export interface TestOrganization {
  currency?: string;
  locale?: string;
  taxSystem?: TaxSystem;
  fiscalYearStartMonth?: number;
}

/**
 * Runs a suite inside one company, the way a signed-in request does.
 *
 * A service that renders money or applies a tax rule reads the company it belongs to, so a
 * suite that drives one directly has to be in a company — as the platform it is refused,
 * which is the point of the tenancy. The organization is written before EVERY test because
 * the harness empties every collection after each one, and it keeps the same id throughout
 * so the scope set here goes on pointing at it.
 */
export function useTestOrganization(fields: TestOrganization = {}): string {
  const organizationId = new Types.ObjectId();
  setDefaultScope({ organizationId: String(organizationId), platform: false });
  beforeEach(async () => {
    await runAsPlatform(() =>
      OrganizationModel.create({
        _id: organizationId,
        name: 'Test Co',
        slug: 'test-co',
        currency: 'USD',
        ...fields,
      }),
    );
  });
  return String(organizationId);
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
