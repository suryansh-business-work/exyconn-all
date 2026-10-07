import { resetWorkspaceStatusCache } from '../../../src/middleware/auth';
import { resetActingOrganizationCache } from '../../../src/middleware/actingOrganization';
import { recordActivity } from '../../../src/modules/admin/presence';
import { OrganizationModel } from '../../../src/modules/organizations/organization.model';
import { UserModel } from '../../../src/modules/admin/user.model';
import { signToken, type TokenPayload } from '../../../src/utils/jwt';
import { ROLES, type Role } from '../../../src/constants/roles';
import { contextOf, requestWith, seedCompany, seedPerson } from './authHarness';

jest.mock('../../../src/modules/admin/presence', () => ({
  recordActivity: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/modules/auth/session.service', () => ({
  sessionIsLive: jest.fn().mockResolvedValue(true),
}));

type Person = Awaited<ReturnType<typeof seedPerson>>;

const tokenFor = (person: Person, claims: Partial<TokenPayload> = {}) =>
  signToken({ id: person.id, email: person.email, roles: [ROLES.EMPLOYEE], ...claims });

const bearer = (token: string, headers: Record<string, string> = {}) =>
  requestWith({ ip: '192.0.2.8', headers: { authorization: `Bearer ${token}`, ...headers } });

async function signedIn(roles: Role[] = [ROLES.FINANCE], extra: Record<string, unknown> = {}) {
  const org = await seedCompany('acme');
  const person = await seedPerson(org, roles, extra);
  return { org, person };
}

beforeEach(() => {
  resetWorkspaceStatusCache();
  resetActingOrganizationCache();
});

describe('buildContext for a portal session', () => {
  it('re-reads the roles and company from the account, not the token', async () => {
    const { org, person } = await signedIn([ROLES.FINANCE]);
    const { ctx, scope } = await contextOf(bearer(tokenFor(person, { organizationId: 'stale' })));
    expect(ctx).toMatchObject({
      user: { id: person.id, roles: [ROLES.FINANCE], organizationId: org },
      organizationId: org,
      ip: '192.0.2.8',
      deviceId: undefined,
    });
    expect(scope).toEqual({ organizationId: org, platform: false, self: null });
    expect(recordActivity).toHaveBeenCalledWith(person.id);
  });

  it('shrugs off a failure to record activity', async () => {
    jest.mocked(recordActivity).mockRejectedValueOnce(new Error('presence down'));
    const { person } = await signedIn();
    const { ctx } = await contextOf(bearer(tokenFor(person)));
    expect(ctx.user?.id).toBe(person.id);
  });

  it.each([
    ['deactivated', { isActive: false }],
    ['blocked', { isBlocked: true }],
  ])('refuses a %s account', async (_label, state) => {
    const { person } = await signedIn([ROLES.FINANCE], state);
    const { ctx } = await contextOf(bearer(tokenFor(person)));
    expect(ctx.user).toBeNull();
  });

  it('refuses a token whose account was deleted', async () => {
    const { person } = await signedIn();
    const token = tokenFor(person);
    await UserModel.deleteMany({});
    await expect(contextOf(bearer(token))).resolves.toMatchObject({ ctx: { user: null } });
  });

  it('retires every token older than the account’s token version', async () => {
    const { person } = await signedIn([ROLES.FINANCE], { tokenVersion: 2 });
    await expect(contextOf(bearer(tokenFor(person, { tv: 1 })))).resolves.toMatchObject({
      ctx: { user: null },
    });
    await expect(contextOf(bearer(tokenFor(person)))).resolves.toMatchObject({
      ctx: { user: null },
    });
    const { ctx } = await contextOf(bearer(tokenFor(person, { tv: 2 })));
    expect(ctx.user?.id).toBe(person.id);
  });

  it('accepts a legacy token with no version for an account at version zero', async () => {
    const { person } = await signedIn();
    await UserModel.collection.updateOne({ _id: person._id }, { $unset: { tokenVersion: '' } });
    const { ctx } = await contextOf(bearer(tokenFor(person)));
    expect(ctx.user?.id).toBe(person.id);
  });
});

describe('the company behind a session', () => {
  it('signs everyone out of a suspended company, after the status cache lapses', async () => {
    const { org, person } = await signedIn();
    const token = tokenFor(person);
    await expect(contextOf(bearer(token))).resolves.toMatchObject({ ctx: { organizationId: org } });

    await OrganizationModel.updateOne({ _id: org }, { status: 'SUSPENDED' });
    await expect(contextOf(bearer(token))).resolves.toMatchObject({ ctx: { organizationId: org } });

    resetWorkspaceStatusCache();
    await expect(contextOf(bearer(token))).resolves.toMatchObject({ ctx: { user: null } });
  });

  it('refuses a session whose company no longer exists', async () => {
    const { person } = await signedIn();
    await OrganizationModel.deleteMany({});
    await expect(contextOf(bearer(tokenFor(person)))).resolves.toMatchObject({
      ctx: { user: null },
    });
  });

  it('has nothing to suspend for a platform administrator with no company', async () => {
    const person = await seedPerson(null, [ROLES.SUPER_ADMIN]);
    const { ctx, scope } = await contextOf(bearer(tokenFor(person)));
    expect(ctx).toMatchObject({ user: { roles: [ROLES.SUPER_ADMIN] }, organizationId: null });
    expect(scope).toEqual({ organizationId: null, platform: false, self: null });
  });

  it('lets a platform administrator work in another company and keep their own account', async () => {
    const { org: home, person } = await signedIn([ROLES.SUPER_ADMIN]);
    const visited = await seedCompany('visited');
    const { ctx, scope } = await contextOf(
      bearer(tokenFor(person), { 'x-organization': 'visited' }),
    );
    expect(ctx.organizationId).toBe(visited);
    expect(ctx.user?.organizationId).toBe(visited);
    expect(scope).toEqual({
      organizationId: visited,
      platform: false,
      self: { userId: person.id, organizationId: home },
    });
  });

  it('keeps anyone else in their own company whatever the address says', async () => {
    const { org, person } = await signedIn([ROLES.ADMIN]);
    await seedCompany('visited');
    const { ctx } = await contextOf(bearer(tokenFor(person), { 'x-organization': 'visited' }));
    expect(ctx.organizationId).toBe(org);
  });
});
