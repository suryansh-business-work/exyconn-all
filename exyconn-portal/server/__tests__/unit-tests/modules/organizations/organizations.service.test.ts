import { Types } from 'mongoose';
import { OrganizationModel, organizationService } from '../../../../src/modules/organizations';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { ROLES } from '../../../../src/constants/roles';
import { organizationOf, runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';

/** A company written straight to the model: these tests need one to exist, not provisioned. */
async function company(name: string, fields: Record<string, unknown> = {}): Promise<string> {
  const slug = name.toLowerCase();
  const created = await runAsPlatform(() =>
    OrganizationModel.create({ name, slug, currency: 'USD', ...fields }),
  );
  return String(created._id);
}

/** A hash nobody can sign in with, built at runtime rather than written in the source. */
const unusableHash = () => `hash-${new Types.ObjectId().toHexString()}`;
const missingId = () => String(new Types.ObjectId());

describe('organizationService.create', () => {
  it('files it under the handle it is given, in canonical standards', async () => {
    const created = await organizationService.create({
      name: 'Initech',
      slug: 'Init Tech!',
      currency: 'usd',
      locale: 'en_us',
      country: '',
      logoUrl: 'https://cdn.example/initech.png',
    });

    expect(created).toMatchObject({
      slug: 'init-tech',
      currency: 'USD',
      country: '',
      locale: 'en-US',
      logoUrl: 'https://cdn.example/initech.png',
    });
  });

  it('defaults the country to none and the language to English', async () => {
    const created = await organizationService.create({ name: 'Hooli', currency: 'EUR' });

    expect(created).toMatchObject({ slug: 'hooli', country: '', locale: 'en', timezone: 'UTC' });
  });

  it('refuses a name that leaves no handle, and stores nothing', async () => {
    await expect(organizationService.create({ name: '!!!', currency: 'USD' })).rejects.toThrow(
      /needs a name that makes a handle/,
    );
    expect(await runAsPlatform(() => OrganizationModel.countDocuments())).toBe(0);
  });

  it.each(['ftp://cdn.example/logo.png', 'not a web address'])(
    'refuses %s as a logo',
    async (logoUrl) => {
      await expect(
        organizationService.create({ name: 'Initech', currency: 'USD', logoUrl }),
      ).rejects.toThrow(/logo must be a web address/);
    },
  );

  it('refuses an empty language tag', async () => {
    await expect(
      organizationService.create({ name: 'Initech', currency: 'USD', locale: '' }),
    ).rejects.toThrow(/language tag/);
  });
});

describe('reading organizations', () => {
  it('lists every company by name', async () => {
    await company('Zeta');
    await company('Alpha');

    const names = (await organizationService.list()).map((row) => row.name);

    expect(names).toEqual(['Alpha', 'Zeta']);
  });

  it('returns one company, and refuses an id that names none', async () => {
    const id = await company('Alpha');

    await expect(organizationService.get(id)).resolves.toMatchObject({ name: 'Alpha' });
    await expect(organizationService.get(missingId())).rejects.toThrow('Organization not found');
  });
});

describe('changing an organization', () => {
  it('updates the fields it is given', async () => {
    const id = await company('Alpha');

    const updated = await organizationService.update(id, { name: 'Alpha Group', currency: 'GBP' });

    expect(updated).toMatchObject({ name: 'Alpha Group', currency: 'GBP', slug: 'alpha' });
  });

  it('checks an update against the same standards as a create', async () => {
    const id = await company('Alpha');

    await expect(organizationService.update(id, { currency: 'XYZ' })).rejects.toThrow(/ISO 4217/);
    await expect(
      organizationService.update(id, { logoUrl: 'mailto:logo@alpha.example' }),
    ).rejects.toThrow(/logo must be a web address/);
  });

  it('refuses to update or suspend a company that does not exist', async () => {
    await expect(organizationService.update(missingId(), { name: 'Ghost' })).rejects.toThrow(
      'Organization not found',
    );
    await expect(organizationService.setStatus(missingId(), 'SUSPENDED')).rejects.toThrow(
      'Organization not found',
    );
  });

  it('suspends a company and lifts the suspension', async () => {
    const id = await company('Alpha');

    await expect(organizationService.setStatus(id, 'SUSPENDED')).resolves.toMatchObject({
      status: 'SUSPENDED',
    });
    await expect(organizationService.setStatus(id, 'ACTIVE')).resolves.toMatchObject({
      status: 'ACTIVE',
    });
  });
});

describe('organizationService.assignAdmin', () => {
  it('refuses a company that does not exist', async () => {
    await expect(
      organizationService.assignAdmin(missingId(), { name: 'Dana', email: 'dana@x.example' }),
    ).rejects.toThrow('Organization not found');
  });

  it('promotes somebody already in the company instead of duplicating them', async () => {
    const id = await company('Alpha');
    await runForOrganization(id, () =>
      UserModel.create({
        name: 'Lee',
        email: 'lee@alpha.example',
        passwordHash: unusableHash(),
        roles: [ROLES.EMPLOYEE],
        isActive: false,
        isBlocked: true,
      }),
    );

    const admin = await organizationService.assignAdmin(id, {
      name: 'Lee',
      email: '  Lee@Alpha.Example ',
    });
    await organizationService.assignAdmin(id, { name: 'Lee', email: 'lee@alpha.example' });

    expect(admin).toMatchObject({ isActive: true, isBlocked: false });
    expect(admin.roles).toEqual(expect.arrayContaining([ROLES.EMPLOYEE, ROLES.ADMIN]));
    const stored = await runAsPlatform(() => UserModel.find({ email: 'lee@alpha.example' }).lean());
    expect(stored).toHaveLength(1);
    expect(stored[0].roles.filter((role) => role === ROLES.ADMIN)).toHaveLength(1);
  });

  it('moves an account that belongs to no company into this one', async () => {
    const id = await company('Alpha');
    await UserModel.collection.insertOne({
      name: 'Loose',
      email: 'loose@alpha.example',
      passwordHash: unusableHash(),
      roles: [ROLES.EMPLOYEE],
      isActive: true,
    });

    const admin = await organizationService.assignAdmin(id, {
      name: 'Loose',
      email: 'loose@alpha.example',
    });

    expect(organizationOf(admin)).toBe(id);
    expect(admin.roles).toContain(ROLES.ADMIN);
  });

  it('will not move a platform administrator into a company', async () => {
    const id = await company('Alpha');
    await UserModel.collection.insertOne({
      name: 'Root',
      email: 'root@platform.example',
      passwordHash: unusableHash(),
      roles: [ROLES.SUPER_ADMIN],
      isActive: true,
    });

    await expect(
      organizationService.assignAdmin(id, { name: 'Root', email: 'root@platform.example' }),
    ).rejects.toThrow(/platform administrator/);
    const raw = await UserModel.collection.findOne({ email: 'root@platform.example' });
    expect(raw?.organizationId).toBeUndefined();
  });
});
