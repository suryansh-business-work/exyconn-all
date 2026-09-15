import type { Request } from 'express';
import {
  buildContext,
  resetWorkspaceStatusCache,
  type GraphQLContext,
} from '../../src/middleware/auth';
import {
  assertAuthenticated,
  assertPlatformAdmin,
  assertRole,
} from '../../src/middleware/roleGuard';
import { bumpTokenVersion, authService } from '../../src/modules/auth/auth.service';
import { OrganizationModel } from '../../src/modules/organizations';
import { TrackerDeviceModel } from '../../src/modules/tracker/models';
import { hashToken } from '../../src/modules/tracker/tracker.auth';
import { signDeviceToken, signToken } from '../../src/utils/jwt';
import { ROLES, type Role } from '../../src/constants/roles';
import {
  organizationOf,
  runAsPlatform,
  runForOrganization,
  runInScope,
} from '../../src/lib/tenant';
import { seedUser } from '../helpers';

const PASSWORD = process.env.TEST_SECURITY_PASSWORD ?? 'Correct@Horse1';
const PORTAL_QUERY = '{ me { id } }';
const TRACKER_QUERY = 'query TrackerMe { trackerMe { consentRequired } }';

/** Builds the context exactly as a request would, inside a fresh request scope. */
function contextFor(token: string, query = PORTAL_QUERY): Promise<GraphQLContext> {
  const req = {
    ip: '203.0.113.7',
    headers: { authorization: `Bearer ${token}` },
    body: { query },
    query: {},
  } as unknown as Request;
  return runInScope({ organizationId: null, platform: false }, () => buildContext({ req }));
}

async function sessionFor(email: string, roles: Role[] = [ROLES.FINANCE]) {
  const user = await seedUser(email, PASSWORD, roles);
  const token = signToken({
    id: user.id,
    email,
    roles,
    organizationId: organizationOf(user),
    tv: 0,
  });
  return { user, token };
}

/** A registered device and the token bound to it, as trackerLogin leaves them. */
async function deviceFor(email: string) {
  const user = await seedUser(email, PASSWORD, [ROLES.EMPLOYEE]);
  const organizationId = organizationOf(user) ?? '';
  const token = signDeviceToken({
    id: user.id,
    email,
    roles: [ROLES.EMPLOYEE],
    organizationId,
    deviceId: 'laptop-1',
    tv: 0,
  });
  await runForOrganization(organizationId, () =>
    TrackerDeviceModel.create({
      userId: user.id,
      deviceId: 'laptop-1',
      platform: 'darwin',
      tokenHash: hashToken(token),
      isActive: true,
    }),
  );
  return { user, token };
}

beforeEach(() => resetWorkspaceStatusCache());

describe('revoking tokens', () => {
  it('accepts a session until its token version is raised', async () => {
    const { user, token } = await sessionFor('rev@exyconn.com');
    await expect(contextFor(token)).resolves.toMatchObject({ user: { id: user.id } });

    await bumpTokenVersion(user.id);

    await expect(contextFor(token)).resolves.toMatchObject({ user: null });
  });

  it('signs out every earlier session when a person changes their password', async () => {
    const { user, token } = await sessionFor('change@exyconn.com');

    await authService.changePassword(user.id, PASSWORD, 'Brand-New-Pass-9');

    await expect(contextFor(token)).resolves.toMatchObject({ user: null });
    const { token: fresh } = await authService.login('change@exyconn.com', 'Brand-New-Pass-9');
    await expect(contextFor(fresh)).resolves.toMatchObject({ user: { id: user.id } });
  });

  it('refuses a session in a suspended company', async () => {
    const { user, token } = await sessionFor('suspended@exyconn.com');
    await runAsPlatform(() =>
      OrganizationModel.updateOne({ _id: organizationOf(user) }, { status: 'SUSPENDED' }),
    );

    await expect(contextFor(token)).resolves.toMatchObject({ user: null });
  });
});

describe('device tokens', () => {
  it('stand for tracker operations while the device row holds them', async () => {
    const { user, token } = await deviceFor('device@exyconn.com');

    await expect(contextFor(token, TRACKER_QUERY)).resolves.toMatchObject({
      user: { id: user.id },
      deviceId: 'laptop-1',
    });
  });

  it('never open a portal operation', async () => {
    const { token } = await deviceFor('device@exyconn.com');

    await expect(contextFor(token, PORTAL_QUERY)).resolves.toMatchObject({ user: null });
    await expect(
      contextFor(token, 'query { trackerMe { consentRequired } listUsers { id } }'),
    ).resolves.toMatchObject({ user: null });
    await expect(
      contextFor(token, 'query { ...Sneaky } fragment Sneaky on Query { me { id } }'),
    ).resolves.toMatchObject({ user: null });
  });

  it('stop working once the device is revoked, or its token replaced', async () => {
    const { token } = await deviceFor('device@exyconn.com');

    await TrackerDeviceModel.updateOne({ deviceId: 'laptop-1' }, { tokenHash: 'another' });
    await expect(contextFor(token, TRACKER_QUERY)).resolves.toMatchObject({ user: null });

    await TrackerDeviceModel.updateOne(
      { deviceId: 'laptop-1' },
      { tokenHash: hashToken(token), revokedAt: new Date(), isActive: false },
    );
    await expect(contextFor(token, TRACKER_QUERY)).resolves.toMatchObject({ user: null });
  });

  it('are refused by every role guard, but still identify the employee', () => {
    const device: GraphQLContext = {
      user: { id: 'u1', email: 'a@b.co', roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] },
      deviceId: 'laptop-1',
      organizationId: null,
    };

    expect(() => assertRole(device, [ROLES.FINANCE])).toThrow(/Sign in to the portal/);
    expect(() => assertPlatformAdmin(device)).toThrow(/Sign in to the portal/);
    expect(assertAuthenticated(device).id).toBe('u1');
  });
});

describe('the platform console', () => {
  const superAdmin = (organizationId: string | null): GraphQLContext => ({
    user: { id: 'u1', email: 'root@exyconn.com', roles: [ROLES.SUPER_ADMIN], organizationId },
    organizationId,
  });

  it('opens for a SUPER_ADMIN who belongs to no company', () => {
    expect(assertPlatformAdmin(superAdmin(null)).id).toBe('u1');
  });

  it('opens for the bootstrap SUPER_ADMIN, who also belongs to the first company', () => {
    expect(assertPlatformAdmin(superAdmin('64b000000000000000000001')).id).toBe('u1');
  });

  it('stays shut to a company ADMIN', () => {
    const admin: GraphQLContext = {
      user: { id: 'u2', email: 'admin@acme.test', roles: [ROLES.ADMIN], organizationId: 'org' },
      organizationId: 'org',
    };
    expect(() => assertPlatformAdmin(admin)).toThrow();
  });
});
