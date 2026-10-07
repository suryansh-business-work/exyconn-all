import { describe, expect, it } from 'vitest';
import { ROLES, canAccess } from '@/auth/roles';

describe('canAccess for the platform screens', () => {
  it('admits only a SUPER_ADMIN, never a company ADMIN', () => {
    expect(canAccess([ROLES.SUPER_ADMIN], ROLES.SUPER_ADMIN)).toBe(true);
    expect(canAccess([ROLES.ADMIN], ROLES.SUPER_ADMIN)).toBe(false);
    expect(canAccess([ROLES.EMPLOYEE, ROLES.TECH], ROLES.SUPER_ADMIN)).toBe(false);
  });

  it('turns away somebody without the module role or ADMIN', () => {
    expect(canAccess([], ROLES.HR)).toBe(false);
    expect(canAccess([ROLES.SUPER_ADMIN], ROLES.HR)).toBe(false);
  });
});
