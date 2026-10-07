import {
  HR_GRANTABLE_ROLES,
  assertMayAssignRoles,
  assertMayChangeSignInFields,
  assertMayManageAccount,
  isPlatformActor,
} from '../../../../src/modules/admin/admin.service';
import { ROLES } from '../../../../src/constants/roles';

const COMPANY = '64b000000000000000000001';
const platform = { id: 'root', roles: [ROLES.SUPER_ADMIN], organizationId: null };
const tenantSuper = { id: 'boot', roles: [ROLES.SUPER_ADMIN], organizationId: COMPANY };
const admin = { id: 'admin1', roles: [ROLES.ADMIN], organizationId: COMPANY };
const hr = { id: 'hr1', roles: [ROLES.HR], organizationId: COMPANY };

describe('isPlatformActor', () => {
  it('is a SUPER_ADMIN with no organization, whether null or absent', () => {
    expect(isPlatformActor(platform)).toBe(true);
    expect(isPlatformActor({ roles: [ROLES.SUPER_ADMIN] })).toBe(true);
  });

  it('is not a SUPER_ADMIN inside a company, nor an ADMIN without one', () => {
    expect(isPlatformActor(tenantSuper)).toBe(false);
    expect(isPlatformActor({ roles: [ROLES.ADMIN], organizationId: null })).toBe(false);
  });
});

describe('assertMayManageAccount', () => {
  const superTarget = { id: 'root', roles: [ROLES.SUPER_ADMIN] };

  it('lets the platform administrator manage a platform administrator', () => {
    expect(() =>
      assertMayManageAccount(platform, { id: 'other', roles: [ROLES.SUPER_ADMIN] }),
    ).not.toThrow();
  });

  it('lets anybody manage their own account', () => {
    expect(() =>
      assertMayManageAccount(tenantSuper, { id: 'boot', roles: [ROLES.SUPER_ADMIN] }),
    ).not.toThrow();
  });

  it('refuses a company admin touching a platform administrator', () => {
    expect(() => assertMayManageAccount(admin, superTarget)).toThrow(
      /Only a platform administrator can change a platform administrator/,
    );
  });

  it('refuses when the actor has no id, even if the target has none either', () => {
    expect(() =>
      assertMayManageAccount({ roles: [ROLES.ADMIN] }, { roles: [ROLES.SUPER_ADMIN] }),
    ).toThrow(/platform administrator/);
  });

  it('lets a company admin manage an ordinary account', () => {
    expect(() =>
      assertMayManageAccount(admin, { id: 'e1', roles: [ROLES.EMPLOYEE] }),
    ).not.toThrow();
  });
});

describe('assertMayAssignRoles', () => {
  it('lets the platform administrator mint a SUPER_ADMIN', () => {
    expect(() => assertMayAssignRoles(platform, [ROLES.SUPER_ADMIN])).not.toThrow();
  });

  it('refuses SUPER_ADMIN to everybody inside a company, admins included', () => {
    expect(() => assertMayAssignRoles(admin, [ROLES.SUPER_ADMIN])).toThrow(
      'Only a platform administrator can grant or remove SUPER_ADMIN.',
    );
    expect(() =>
      assertMayAssignRoles(tenantSuper, [ROLES.EMPLOYEE], {
        roles: [ROLES.SUPER_ADMIN, ROLES.EMPLOYEE],
      }),
    ).toThrow(/SUPER_ADMIN/);
  });

  it('lets a company admin grant any company role', () => {
    expect(() =>
      assertMayAssignRoles(admin, [ROLES.FINANCE, ROLES.TECH, ROLES.ADMIN]),
    ).not.toThrow();
  });

  it('refuses HR granting ADMIN on a new account', () => {
    expect(() => assertMayAssignRoles(hr, [ROLES.ADMIN])).toThrow(
      'Only an administrator can grant the ADMIN role.',
    );
  });

  it('refuses HR editing an administrator even without touching roles', () => {
    expect(() => assertMayAssignRoles(hr, undefined, { id: 'a', roles: [ROLES.ADMIN] })).toThrow(
      /Only an administrator can change an administrator/,
    );
  });

  it('refuses HR changing their own roles, even to a grantable one', () => {
    expect(() =>
      assertMayAssignRoles(hr, [ROLES.HR, ROLES.EMPLOYEE], { id: 'hr1', roles: [ROLES.HR] }),
    ).toThrow('You cannot change your own roles.');
  });

  it('lets HR save their own record unchanged', () => {
    expect(() =>
      assertMayAssignRoles(hr, [ROLES.HR], { id: 'hr1', roles: [ROLES.HR] }),
    ).not.toThrow();
  });

  it('names every privileged role HR tried to add or remove', () => {
    expect(() =>
      assertMayAssignRoles(hr, [ROLES.FINANCE], { id: 'e1', roles: [ROLES.TECH] }),
    ).toThrow('Only an administrator can grant or remove FINANCE, TECH.');
  });

  it('skips the self check for an actor with no id', () => {
    expect(() =>
      assertMayAssignRoles({ roles: [ROLES.HR] }, [ROLES.SUPPORT], { roles: [] }),
    ).not.toThrow();
  });

  it('allows HR every grantable role, and nothing administrative is grantable', () => {
    expect(() => assertMayAssignRoles(hr, [...HR_GRANTABLE_ROLES])).not.toThrow();
    for (const role of [ROLES.ADMIN, ROLES.HR, ROLES.FINANCE, ROLES.TECH, ROLES.TRACKER]) {
      expect(HR_GRANTABLE_ROLES.has(role)).toBe(false);
    }
  });
});

describe('assertMayChangeSignInFields', () => {
  const target = { id: 'e1', roles: [ROLES.EMPLOYEE], email: 'Asha@Exyconn.com', isActive: true };

  it('lets an admin and the platform administrator change anything', () => {
    const change = { email: 'new@exyconn.com', password: 'x', isActive: false };
    expect(() => assertMayChangeSignInFields(admin, change, target)).not.toThrow();
    expect(() => assertMayChangeSignInFields(platform, change, target)).not.toThrow();
  });

  it('lets HR send back the values it loaded, whatever their case or padding', () => {
    expect(() =>
      assertMayChangeSignInFields(hr, { email: '  asha@exyconn.com ', isActive: true }, target),
    ).not.toThrow();
    expect(() => assertMayChangeSignInFields(hr, {}, target)).not.toThrow();
  });

  it('refuses HR changing the email, the password or the active flag', () => {
    const message = /Only an administrator can change a person/;
    expect(() => assertMayChangeSignInFields(hr, { email: 'other@exyconn.com' }, target)).toThrow(
      message,
    );
    expect(() => assertMayChangeSignInFields(hr, { password: 'anything' }, target)).toThrow(
      message,
    );
    expect(() => assertMayChangeSignInFields(hr, { isActive: false }, target)).toThrow(message);
  });

  it('treats a target with no stored email as an empty one', () => {
    expect(() =>
      assertMayChangeSignInFields(hr, { email: 'set@exyconn.com' }, { roles: [ROLES.EMPLOYEE] }),
    ).toThrow(/Only an administrator/);
  });
});
