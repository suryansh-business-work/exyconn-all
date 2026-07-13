import { describe, it, expect } from 'vitest';
import { ROLES, canAccess } from '../../src/auth/roles';
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
