import { Types } from 'mongoose';
import { OrganizationModel, organizationsResolvers } from '../../../../src/modules/organizations';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { runAsPlatform } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const { Query, Mutation, Organization, User } = organizationsResolvers;

const ctxAs = (roles: Role[], extra: Partial<GraphQLContext> = {}): GraphQLContext => ({
  user: { id: String(new Types.ObjectId()), email: 'someone@platform.example', roles },
  ...extra,
});
const superAdmin = ctxAs([ROLES.SUPER_ADMIN]);
const companyAdmin = ctxAs([ROLES.ADMIN]);
const anonymous: GraphQLContext = { user: null };

async function company(name: string): Promise<string> {
  const created = await runAsPlatform(() =>
    OrganizationModel.create({ name, slug: name.toLowerCase(), currency: 'USD' }),
  );
  return String(created._id);
}

describe('the platform console guard', () => {
  it('lets only a platform administrator list the companies', async () => {
    await company('Alpha');

    const rows = await Query.organizations(null, {}, superAdmin);

    expect(rows.map((row) => row.name)).toEqual(['Alpha']);
    expect(rows[0].id).toEqual(expect.any(String));
    await expect(Query.organizations(null, {}, companyAdmin)).rejects.toThrow(/do not have access/);
    await expect(Query.organizations(null, {}, anonymous)).rejects.toThrow(
      /Authentication required/,
    );
  });

  it('refuses a tracker device token even when it carries the role', async () => {
    const device = ctxAs([ROLES.SUPER_ADMIN], { deviceId: 'laptop-1' });

    await expect(Query.organizations(null, {}, device)).rejects.toThrow(/Sign in to the portal/);
  });

  it('refuses every mutation to a company administrator', async () => {
    const id = await company('Alpha');

    await expect(
      Mutation.createOrganization(null, { input: { name: 'Beta', currency: 'USD' } }, companyAdmin),
    ).rejects.toThrow(/do not have access/);
    await expect(
      Mutation.updateOrganization(null, { id, input: { name: 'Mine' } }, companyAdmin),
    ).rejects.toThrow(/do not have access/);
    await expect(
      Mutation.setOrganizationStatus(null, { id, status: 'SUSPENDED' }, companyAdmin),
    ).rejects.toThrow(/do not have access/);
    await expect(
      Mutation.assignOrganizationAdmin(
        null,
        { organizationId: id, input: { name: 'Eve', email: 'eve@x.example' } },
        companyAdmin,
      ),
    ).rejects.toThrow(/do not have access/);
  });
});

describe('platform administrator operations', () => {
  it('reads one company with its id', async () => {
    const id = await company('Alpha');

    await expect(Query.organization(null, { id }, superAdmin)).resolves.toMatchObject({
      id,
      name: 'Alpha',
    });
  });

  it('creates, renames and suspends a company', async () => {
    const created = await Mutation.createOrganization(
      null,
      { input: { name: 'Beta Works', currency: 'eur' } },
      superAdmin,
    );
    expect(created).toMatchObject({ slug: 'beta-works', currency: 'EUR' });

    const renamed = await Mutation.updateOrganization(
      null,
      { id: created.id, input: { name: 'Beta Group' } },
      superAdmin,
    );
    const suspended = await Mutation.setOrganizationStatus(
      null,
      { id: created.id, status: 'SUSPENDED' },
      superAdmin,
    );

    expect(renamed).toMatchObject({ id: created.id, name: 'Beta Group' });
    expect(suspended).toMatchObject({ id: created.id, status: 'SUSPENDED' });
  });

  it('appoints a company administrator', async () => {
    const id = await company('Alpha');

    const admin = await Mutation.assignOrganizationAdmin(
      null,
      { organizationId: id, input: { name: 'Dana', email: 'dana@alpha.example' } },
      superAdmin,
    );

    expect(admin.id).toEqual(expect.any(String));
    expect(admin.roles).toContain(ROLES.ADMIN);
    expect(User.organizationId(admin)).toBe(id);
  });
});

describe('myOrganization', () => {
  it('needs somebody signed in', async () => {
    await expect(Query.myOrganization(null, {}, anonymous)).rejects.toThrow(
      /Authentication required/,
    );
  });

  it('is null for a caller who works in no company', async () => {
    await expect(Query.myOrganization(null, {}, superAdmin)).resolves.toBeNull();
    await expect(
      Query.myOrganization(null, {}, ctxAs([ROLES.SUPER_ADMIN], { organizationId: null })),
    ).resolves.toBeNull();
  });

  it('returns the company the request works in, to anyone in it', async () => {
    const id = await company('Alpha');
    const employee = ctxAs([ROLES.EMPLOYEE], { organizationId: id });

    await expect(Query.myOrganization(null, {}, employee)).resolves.toMatchObject({
      id,
      name: 'Alpha',
    });
  });
});

describe('Organization fields on a row written before they existed', () => {
  it('reads a missing text field as empty and a missing operator flag as false', () => {
    expect(Organization.legalName({})).toBe('');
    expect(Organization.country({ country: null })).toBe('');
    expect(Organization.contactEmail({})).toBe('');
    expect(Organization.logoUrl({ logoUrl: null })).toBe('');
    expect(Organization.isPlatformOperator({})).toBe(false);
    expect(Organization.isPlatformOperator({ isPlatformOperator: null })).toBe(false);
  });

  it('passes stored values through', () => {
    expect(Organization.legalName({ legalName: 'Alpha Pvt Ltd' })).toBe('Alpha Pvt Ltd');
    expect(Organization.country({ country: 'IN' })).toBe('IN');
    expect(Organization.contactEmail({ contactEmail: 'hi@alpha.example' })).toBe(
      'hi@alpha.example',
    );
    expect(Organization.logoUrl({ logoUrl: 'https://cdn.example/a.png' })).toBe(
      'https://cdn.example/a.png',
    );
    expect(Organization.isPlatformOperator({ isPlatformOperator: true })).toBe(true);
  });
});

describe('User.organizationId', () => {
  it('names the company a person belongs to, and null for one in none', () => {
    const id = new Types.ObjectId();

    expect(User.organizationId({ organizationId: id })).toBe(String(id));
    expect(User.organizationId({})).toBeNull();
  });
});
