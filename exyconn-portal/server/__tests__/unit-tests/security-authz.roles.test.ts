import { GraphQLError } from 'graphql';
import {
  assertMayAssignRoles,
  assertMayChangeSignInFields,
  assertMayManageAccount,
} from '../../src/modules/admin/admin.service';
import { organizationService } from '../../src/modules/organizations';
import { UserModel } from '../../src/modules/admin/user.model';
import { integrationsResolvers, principalForApiKey } from '../../src/modules/integrations';
import { organizationOf, runAsPlatform, runForOrganization } from '../../src/lib/tenant';
import { ROLES, type Role } from '../../src/constants/roles';
import { seedOrganization } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

const COMPANY = '64b000000000000000000001';
const platformAdmin = { id: 'root', roles: [ROLES.SUPER_ADMIN], organizationId: null };
const admin = { id: 'admin1', roles: [ROLES.ADMIN], organizationId: COMPANY };
const hr = { id: 'hr1', roles: [ROLES.HR], organizationId: COMPANY };

const forbiddenFor = (fn: () => void) => {
  try {
    fn();
    return 'OK';
  } catch (error) {
    return error instanceof GraphQLError ? error.extensions.code : String(error);
  }
};

describe('C1: role writes inside a company', () => {
  it('never grants SUPER_ADMIN from inside a company, even to an ADMIN', () => {
    expect(forbiddenFor(() => assertMayAssignRoles(admin, [ROLES.SUPER_ADMIN]))).toBe('FORBIDDEN');
    expect(
      forbiddenFor(() =>
        assertMayAssignRoles(admin, [ROLES.ADMIN, ROLES.SUPER_ADMIN], { roles: [ROLES.ADMIN] }),
      ),
    ).toBe('FORBIDDEN');
    // A SUPER_ADMIN who is inside a company is a company's staff, not the platform.
    const insider = { ...admin, roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] };
    expect(forbiddenFor(() => assertMayAssignRoles(insider, [ROLES.SUPER_ADMIN]))).toBe(
      'FORBIDDEN',
    );
  });

  it('lets only a platform administrator grant it', () => {
    expect(forbiddenFor(() => assertMayAssignRoles(platformAdmin, [ROLES.SUPER_ADMIN]))).toBe('OK');
  });

  it('lets an ADMIN grant any company role', () => {
    expect(
      forbiddenFor(() => assertMayAssignRoles(admin, [ROLES.ADMIN, ROLES.FINANCE, ROLES.TECH])),
    ).toBe('OK');
  });

  it('limits HR to the ordinary department roles', () => {
    expect(forbiddenFor(() => assertMayAssignRoles(hr, [ROLES.EMPLOYEE, ROLES.CRM]))).toBe('OK');
    for (const role of [ROLES.HR, ROLES.FINANCE, ROLES.TECH, ROLES.TRACKER, ROLES.ADMIN]) {
      expect(forbiddenFor(() => assertMayAssignRoles(hr, [ROLES.EMPLOYEE, role]))).toBe(
        'FORBIDDEN',
      );
    }
  });

  it('stops HR taking a privileged role away too', () => {
    const financeLead = { id: 'f1', roles: [ROLES.EMPLOYEE, ROLES.FINANCE] };
    expect(forbiddenFor(() => assertMayAssignRoles(hr, [ROLES.EMPLOYEE], financeLead))).toBe(
      'FORBIDDEN',
    );
    // The same account's other fields stay editable when its roles come back unchanged.
    expect(
      forbiddenFor(() => assertMayAssignRoles(hr, [ROLES.FINANCE, ROLES.EMPLOYEE], financeLead)),
    ).toBe('OK');
  });

  it('stops HR changing its own roles', () => {
    const self = { id: hr.id, roles: [ROLES.HR] as Role[] };
    expect(forbiddenFor(() => assertMayAssignRoles(hr, [ROLES.HR, ROLES.EMPLOYEE], self))).toBe(
      'FORBIDDEN',
    );
  });

  it('keeps email, password and active status an administrator’s', () => {
    const target = { id: 'e1', roles: [ROLES.EMPLOYEE], email: 'e1@x.com', isActive: true };
    const hrCheck = (input: Parameters<typeof assertMayChangeSignInFields>[1]) =>
      forbiddenFor(() => assertMayChangeSignInFields(hr, input, target));
    expect(hrCheck({ email: 'attacker@x.com' })).toBe('FORBIDDEN');
    expect(hrCheck({ password: process.env.TEST_NEW_PASSWORD ?? 'a-new-password' })).toBe(
      'FORBIDDEN',
    );
    expect(hrCheck({ isActive: false })).toBe('FORBIDDEN');
    // A form sending back what it loaded is not a change.
    expect(hrCheck({ email: 'E1@x.com', isActive: true, password: '' })).toBe('OK');
    expect(
      forbiddenFor(() => assertMayChangeSignInFields(admin, { email: 'new@x.com' }, target)),
    ).toBe('OK');
  });

  it('keeps a company’s staff away from a platform administrator’s account', () => {
    const root = { id: 'root', roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN] };
    expect(forbiddenFor(() => assertMayManageAccount(admin, root))).toBe('FORBIDDEN');
    expect(
      forbiddenFor(() => assertMayManageAccount({ ...root, organizationId: COMPANY }, root)),
    ).toBe('OK');
    expect(forbiddenFor(() => assertMayManageAccount(platformAdmin, root))).toBe('OK');
  });
});

describe('M5: appointing a company administrator', () => {
  it('refuses to move a platform administrator into a company', async () => {
    const company = await seedOrganization('Acme');
    await runAsPlatform(() =>
      UserModel.create({
        name: 'Root',
        email: 'root@exyconn.com',
        passwordHash: 'hash',
        roles: [ROLES.SUPER_ADMIN],
        organizationId: null,
      }),
    );
    await expect(
      organizationService.assignAdmin(String(company._id), {
        name: 'Root',
        email: 'root@exyconn.com',
      }),
    ).rejects.toThrow(/platform administrator/);
    const root = await runAsPlatform(() => UserModel.findOne({ email: 'root@exyconn.com' }).lean());
    expect(root && organizationOf(root)).toBeNull();
    expect(root?.roles).toEqual([ROLES.SUPER_ADMIN]);
  });
});

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const KEYS = integrationsResolvers.Mutation as unknown as Record<string, Resolver>;

describe('C2: API keys', () => {
  const adminIn = (organizationId: string): GraphQLContext => ({
    user: { id: 'a1', email: 'a@x.com', roles: [ROLES.ADMIN], organizationId },
    organizationId,
  });

  it('refuses SUPER_ADMIN and any expiry beyond a year', async () => {
    const company = String((await seedOrganization('Acme'))._id);
    await runForOrganization(company, async () => {
      await expect(
        KEYS.createApiKey(null, { name: 'x', roles: [ROLES.SUPER_ADMIN] }, adminIn(company)),
      ).rejects.toThrow(/may be granted/);
      const tooLate = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000);
      await expect(
        KEYS.createApiKey(
          null,
          { name: 'x', roles: [ROLES.CRM], expiresAt: tooLate },
          adminIn(company),
        ),
      ).rejects.toThrow(/at most one year/);
    });
  });

  it('resolves a key to the company it was minted in', async () => {
    const company = String((await seedOrganization('Acme'))._id);
    const issued = (await runForOrganization(company, () =>
      KEYS.createApiKey(null, { name: 'CRM sync', roles: [ROLES.CRM] }, adminIn(company)),
    )) as { key: string };
    const principal = await runAsPlatform(() => principalForApiKey(issued.key));
    expect(principal).toMatchObject({ roles: [ROLES.CRM], organizationId: company });
  });
});
