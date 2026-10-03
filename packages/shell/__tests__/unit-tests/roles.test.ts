import { describe, it, expect } from 'vitest';
import { ROLE_LABELS, ROLES, canAccess, roleLabel, roleList } from '../../src/auth/roles';
import { accessibleModules, MODULES } from '../../src/config/modules';

describe('roles', () => {
  it('ADMIN can access every module', () => {
    expect(accessibleModules([ROLES.ADMIN])).toHaveLength(MODULES.length);
    expect(canAccess([ROLES.ADMIN], ROLES.FINANCE)).toBe(true);
  });

  it('a single module role can only access its own module', () => {
    const modules = accessibleModules([ROLES.FINANCE]);
    expect(modules).toHaveLength(1);
    expect(modules[0].key).toBe('finance');
    expect(canAccess([ROLES.FINANCE], ROLES.HR)).toBe(false);
  });

  it('multiple roles unlock multiple modules', () => {
    const modules = accessibleModules([ROLES.FINANCE, ROLES.HR]);
    expect(modules.map((m) => m.key).sort()).toEqual(['finance', 'hr']);
    expect(canAccess([ROLES.FINANCE, ROLES.HR], ROLES.HR)).toBe(true);
  });
});

describe('role labels', () => {
  it('reads the header line the way people say it', () => {
    const roles = [ROLES.EMPLOYEE, ROLES.ADMIN, ROLES.SUPER_ADMIN];
    expect(roleList(roles, (text) => text)).toBe('Employee, Admin, Super Admin');
  });

  it('keeps acronyms whole instead of title-casing them', () => {
    expect([ROLES.CRM, ROLES.HR, ROLES.AI, ROLES.IT].map(roleLabel)).toEqual([
      'CRM',
      'HR',
      'AI',
      'IT',
    ]);
  });

  it('labels every role there is', () => {
    expect(Object.keys(ROLE_LABELS).sort((a, b) => a.localeCompare(b))).toEqual(
      Object.values(ROLES).sort((a, b) => a.localeCompare(b)),
    );
  });

  it('shows the code for a role this build does not know, and translates each label', () => {
    expect(roleLabel('NEW_ROLE')).toBe('NEW_ROLE');
    expect(roleList([ROLES.HR, ROLES.FINANCE], (text) => `«${text}»`)).toBe('«HR», «Finance»');
  });
});
