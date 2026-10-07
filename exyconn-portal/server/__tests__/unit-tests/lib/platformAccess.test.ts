import { Types } from 'mongoose';
import type { GraphQLError } from 'graphql';
import {
  assertPlatformOrganization,
  assertPlatformStaff,
  callerOrganization,
  invalidatePlatformOperatorCache,
  platformOperatorOrganizationId,
  restrictToPlatform,
} from '../../../src/lib/platformAccess';
import { invalidatePermissionCache } from '../../../src/lib/permissions';
import { OrganizationModel } from '../../../src/modules/organizations/organization.model';
import { RolePermissionModel } from '../../../src/modules/permissions/permission.model';
import { runForOrganization } from '../../../src/lib/tenant';
import { ROLES, type Role } from '../../../src/constants/roles';
import type { GraphQLContext } from '../../../src/middleware/auth';

const ctxFor = (roles: Role[], organizationId: string | null): GraphQLContext => ({
  user: { id: String(new Types.ObjectId()), email: 'u@example.com', roles, organizationId },
  organizationId,
});

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'ALLOWED',
    (error: unknown) => (error as GraphQLError).extensions?.code,
  );

const operator = () =>
  OrganizationModel.create({
    name: 'Exyconn',
    slug: 'exyconn',
    currency: 'USD',
    isPlatformOperator: true,
  }).then((org) => String(org._id));

beforeEach(() => {
  invalidatePlatformOperatorCache();
  invalidatePermissionCache();
});
afterEach(() => jest.restoreAllMocks());

describe('platformOperatorOrganizationId', () => {
  it('is null while no company is flagged', async () => {
    await OrganizationModel.create({ name: 'Customer', slug: 'customer', currency: 'USD' });
    await expect(platformOperatorOrganizationId()).resolves.toBeNull();
  });

  it('finds the flagged company and trusts it for a minute', async () => {
    const id = await operator();
    const start = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(start);
    await expect(platformOperatorOrganizationId()).resolves.toBe(id);

    await OrganizationModel.updateMany({}, { isPlatformOperator: false });
    clock.mockReturnValue(start + 59_999);
    await expect(platformOperatorOrganizationId()).resolves.toBe(id);

    clock.mockReturnValue(start + 60_000);
    await expect(platformOperatorOrganizationId()).resolves.toBeNull();
  });
});

describe('callerOrganization', () => {
  const user = { id: 'u', email: 'u@example.com', roles: [] as Role[] };

  it('prefers the context, then the token, then the scope', async () => {
    expect(
      callerOrganization({ user, organizationId: 'ctx' }, { ...user, organizationId: 'tok' }),
    ).toBe('ctx');
    expect(callerOrganization({ user }, { ...user, organizationId: 'tok' })).toBe('tok');
    expect(callerOrganization({ user }, user)).toBeNull();
    const scoped = String(new Types.ObjectId());
    await expect(
      runForOrganization(scoped, () => callerOrganization({ user }, user)),
    ).resolves.toBe(scoped);
  });
});

describe('assertPlatformOrganization', () => {
  it('refuses an anonymous caller', async () => {
    await expect(codeOf(assertPlatformOrganization({ user: null }))).resolves.toBe(
      'UNAUTHENTICATED',
    );
  });

  it('lets a SUPER_ADMIN who belongs to no company through without a lookup', async () => {
    const find = jest.spyOn(OrganizationModel, 'findOne');
    const ctx = ctxFor([ROLES.SUPER_ADMIN], null);
    await expect(assertPlatformOrganization(ctx)).resolves.toBe(ctx.user);
    expect(find).not.toHaveBeenCalled();
  });

  it('lets anyone signed in to the operator company through', async () => {
    const id = await operator();
    const ctx = ctxFor([ROLES.TECH], id);
    await expect(assertPlatformOrganization(ctx)).resolves.toBe(ctx.user);
  });

  it('refuses a customer company, a SUPER_ADMIN inside one, and an orphan account', async () => {
    await operator();
    const customer = String(new Types.ObjectId());
    await expect(codeOf(assertPlatformOrganization(ctxFor([ROLES.ADMIN], customer)))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(
      codeOf(assertPlatformOrganization(ctxFor([ROLES.SUPER_ADMIN], customer))),
    ).resolves.toBe('FORBIDDEN');
    await expect(codeOf(assertPlatformOrganization(ctxFor([ROLES.TECH], null)))).resolves.toBe(
      'FORBIDDEN',
    );
  });

  it('refuses everyone in a company when no operator is flagged', async () => {
    const customer = String(new Types.ObjectId());
    await expect(codeOf(assertPlatformOrganization(ctxFor([ROLES.ADMIN], customer)))).resolves.toBe(
      'FORBIDDEN',
    );
  });
});

describe('assertPlatformStaff', () => {
  it('lets a company-less SUPER_ADMIN through whatever the module roles', async () => {
    const ctx = ctxFor([ROLES.SUPER_ADMIN], null);
    await expect(assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], 'EDIT')).resolves.toBe(
      ctx.user,
    );
  });

  it('requires the operator company and the module permission together', async () => {
    const id = await operator();
    const tech = ctxFor([ROLES.TECH], id);
    await expect(assertPlatformStaff(tech, 'TechConfig', [ROLES.TECH], 'EDIT')).resolves.toBe(
      tech.user,
    );
    await expect(
      codeOf(assertPlatformStaff(ctxFor([ROLES.HR], id), 'TechConfig', [ROLES.TECH], 'EDIT')),
    ).resolves.toBe('FORBIDDEN');

    await runForOrganization(id, () =>
      RolePermissionModel.create({ role: ROLES.TECH, module: 'TechConfig', actions: ['VIEW'] }),
    );
    await expect(
      runForOrganization(id, () =>
        codeOf(assertPlatformStaff(tech, 'TechConfig', [ROLES.TECH], 'EDIT')),
      ),
    ).resolves.toBe('FORBIDDEN');
  });

  it('refuses module staff of a customer company', async () => {
    await operator();
    const ctx = ctxFor([ROLES.TECH], String(new Types.ObjectId()));
    await expect(
      codeOf(assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], 'VIEW')),
    ).resolves.toBe('FORBIDDEN');
    await expect(
      codeOf(assertPlatformStaff({ user: null }, 'TechConfig', [ROLES.TECH], 'VIEW')),
    ).resolves.toBe('UNAUTHENTICATED');
  });
});

describe('restrictToPlatform', () => {
  it('runs each wrapped resolver only for the platform operator', async () => {
    const id = await operator();
    const list = jest.fn().mockResolvedValue(['row']);
    const wrapped = restrictToPlatform({ listThings: list });

    const inside = ctxFor([ROLES.TECH], id);
    await expect(wrapped.listThings(null as never, { a: 1 } as never, inside)).resolves.toEqual([
      'row',
    ]);
    expect(list).toHaveBeenCalledWith(null, { a: 1 }, inside);

    const outside = ctxFor([ROLES.TECH], String(new Types.ObjectId()));
    await expect(
      codeOf(wrapped.listThings(null as never, {} as never, outside) as Promise<unknown>),
    ).resolves.toBe('FORBIDDEN');
    expect(list).toHaveBeenCalledTimes(1);
  });
});
