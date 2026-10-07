import { ALL_ROLES, ORGANIZATION_ROLES, ROLES } from '../../../src/constants/roles';

describe('roles', () => {
  it('lists every role identifier exactly once', () => {
    expect(ALL_ROLES).toEqual(Object.values(ROLES));
    expect(new Set(ALL_ROLES).size).toBe(ALL_ROLES.length);
    expect(ALL_ROLES).toContain(ROLES.SUPER_ADMIN);
  });

  it('never lets a company grant the platform role', () => {
    expect(ORGANIZATION_ROLES).not.toContain(ROLES.SUPER_ADMIN);
    expect(ORGANIZATION_ROLES).toHaveLength(ALL_ROLES.length - 1);
    expect(ORGANIZATION_ROLES).toEqual(expect.arrayContaining([ROLES.ADMIN, ROLES.EMPLOYEE]));
  });
});
