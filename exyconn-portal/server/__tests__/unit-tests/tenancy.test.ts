import mongoose from 'mongoose';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { DepartmentModel } from '../../src/modules/hr/department.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { BlogPostModel } from '../../src/modules/website/models/blog.model';
import { OrganizationModel } from '../../src/modules/organizations';
import {
  ORGANIZATION_FIELD,
  PLATFORM_MODELS,
  TenantScopeError,
  assertTenantCoverage,
  organizationOf,
  runAsPlatform,
  runForOrganization,
  setDefaultScope,
} from '../../src/lib/tenant';

/** Two companies on one platform, as every test below needs. */
async function twoOrganizations() {
  const [a, b] = await runAsPlatform(() =>
    OrganizationModel.create([
      { name: 'Acme', slug: 'acme', currency: 'EUR' },
      { name: 'Globex', slug: 'globex', currency: 'USD' },
    ]),
  );
  return { a: String(a._id), b: String(b._id) };
}

function client(name: string) {
  return { name, email: `${name}@example.com`, phone: '1', company: name, status: 'ACTIVE' };
}

describe('every model is classified', () => {
  it('carries an organization unless it belongs to the platform', () => {
    expect(assertTenantCoverage).not.toThrow();
  });

  it('scopes a company model and leaves a platform model alone', () => {
    expect(ClientModel.schema.path(ORGANIZATION_FIELD)).toBeDefined();
    expect(BlogPostModel.schema.path(ORGANIZATION_FIELD)).toBeUndefined();
    expect(PLATFORM_MODELS.has('BlogPost')).toBe(true);
  });
});

describe('a company only ever sees its own records', () => {
  it('stamps a write with the organization in scope', async () => {
    const { a } = await twoOrganizations();
    const created = await runForOrganization(a, () => ClientModel.create(client('one')));
    expect(organizationOf(created)).toBe(a);
  });

  it('filters every read by it', async () => {
    const { a, b } = await twoOrganizations();
    await runForOrganization(a, () => ClientModel.create(client('acme-only')));
    await runForOrganization(b, () => ClientModel.create(client('globex-only')));

    const mine = await runForOrganization(a, () => ClientModel.find().lean());
    expect(mine.map((row) => row.name)).toEqual(['acme-only']);
    const counted = await runForOrganization(b, () => ClientModel.countDocuments());
    expect(counted).toBe(1);
  });

  it('cannot read or write another company record, even by its id', async () => {
    const { a, b } = await twoOrganizations();
    const theirs = await runForOrganization(b, () => ClientModel.create(client('theirs')));

    const read = await runForOrganization(a, () => ClientModel.findById(theirs._id).lean());
    expect(read).toBeNull();
    const written = await runForOrganization(a, () =>
      ClientModel.findByIdAndUpdate(theirs._id, { name: 'taken' }, { new: true }).lean(),
    );
    expect(written).toBeNull();
    const deleted = await runForOrganization(a, () => ClientModel.deleteMany({}));
    expect(deleted.deletedCount).toBe(0);
  });

  it('refuses to touch company data with no organization in scope', async () => {
    setDefaultScope(null);
    try {
      await expect(ClientModel.find().lean()).rejects.toThrow(TenantScopeError);
      await expect(ClientModel.create(client('nobody'))).rejects.toThrow(TenantScopeError);
    } finally {
      setDefaultScope({ organizationId: null, platform: true });
    }
  });
});

describe('what is unique, and to whom', () => {
  it('lets two companies use the same name, and still stops a duplicate inside one', async () => {
    const { a, b } = await twoOrganizations();
    await DepartmentModel.init();

    await runForOrganization(a, () => DepartmentModel.create({ name: 'Engineering' }));
    await expect(
      runForOrganization(b, () => DepartmentModel.create({ name: 'Engineering' })),
    ).resolves.toBeDefined();
    await expect(
      runForOrganization(a, () => DepartmentModel.create({ name: 'Engineering' })),
    ).rejects.toThrow(mongoose.mongo.MongoServerError);
  });

  it('keeps an email address unique across the whole platform, since it is how you sign in', async () => {
    const { a, b } = await twoOrganizations();
    await UserModel.init();
    const person = { name: 'Asha', passwordHash: 'x', roles: ['EMPLOYEE'] };

    await runForOrganization(a, () => UserModel.create({ ...person, email: 'asha@example.com' }));
    await expect(
      runForOrganization(b, () => UserModel.create({ ...person, email: 'asha@example.com' })),
    ).rejects.toThrow(mongoose.mongo.MongoServerError);
  });
});
