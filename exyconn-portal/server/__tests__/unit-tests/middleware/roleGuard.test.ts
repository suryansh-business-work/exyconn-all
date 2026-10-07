import type { GraphQLError } from 'graphql';
import {
  assertAuthenticated,
  assertPlatformAdmin,
  assertRole,
} from '../../../src/middleware/roleGuard';
import { ROLES, type Role } from '../../../src/constants/roles';
import type { GraphQLContext } from '../../../src/middleware/auth';

const ctxOf = (roles: Role[] | undefined, extra: Partial<GraphQLContext> = {}): GraphQLContext => ({
  user: { id: 'u1', email: 'u@example.com', roles: roles as Role[] },
  ...extra,
});

const codeOf = (fn: () => unknown) => {
  try {
    fn();
    return 'ALLOWED';
  } catch (error) {
    return (error as GraphQLError).extensions?.code;
  }
};

describe('assertRole', () => {
  it('returns the user holding an allowed role, and ADMIN always', () => {
    const finance = ctxOf([ROLES.FINANCE]);
    expect(assertRole(finance, [ROLES.HR, ROLES.FINANCE])).toBe(finance.user);
    expect(codeOf(() => assertRole(ctxOf([ROLES.ADMIN]), [ROLES.HR]))).toBe('ALLOWED');
  });

  it('refuses the wrong role, no roles at all, and nobody', () => {
    expect(codeOf(() => assertRole(ctxOf([ROLES.CRM]), [ROLES.HR]))).toBe('FORBIDDEN');
    expect(codeOf(() => assertRole(ctxOf(undefined), [ROLES.HR]))).toBe('FORBIDDEN');
    expect(codeOf(() => assertRole({ user: null }, [ROLES.HR]))).toBe('UNAUTHENTICATED');
  });

  it('refuses a tracker device token, from the context or from the token', () => {
    expect(() => assertRole(ctxOf([ROLES.ADMIN], { deviceId: 'laptop' }), [ROLES.HR])).toThrow(
      'Sign in to the portal to do this.',
    );
    const deviceUser: GraphQLContext = {
      user: { id: 'u1', email: 'u@example.com', roles: [ROLES.ADMIN], deviceId: 'laptop' },
    };
    expect(codeOf(() => assertRole(deviceUser, [ROLES.HR]))).toBe('FORBIDDEN');
  });
});

describe('assertPlatformAdmin', () => {
  it('opens only for SUPER_ADMIN', () => {
    const superAdmin = ctxOf([ROLES.SUPER_ADMIN]);
    expect(assertPlatformAdmin(superAdmin)).toBe(superAdmin.user);
    expect(codeOf(() => assertPlatformAdmin(ctxOf([ROLES.ADMIN])))).toBe('FORBIDDEN');
    expect(codeOf(() => assertPlatformAdmin(ctxOf(undefined)))).toBe('FORBIDDEN');
    expect(codeOf(() => assertPlatformAdmin({ user: null }))).toBe('UNAUTHENTICATED');
  });

  it('refuses a device token even for SUPER_ADMIN', () => {
    expect(codeOf(() => assertPlatformAdmin(ctxOf([ROLES.SUPER_ADMIN], { deviceId: 'd' })))).toBe(
      'FORBIDDEN',
    );
  });
});

describe('assertAuthenticated', () => {
  it('asks only who is calling, so a device token passes', () => {
    const device = ctxOf([ROLES.EMPLOYEE], { deviceId: 'laptop' });
    expect(assertAuthenticated(device)).toBe(device.user);
    expect(codeOf(() => assertAuthenticated({ user: null }))).toBe('UNAUTHENTICATED');
  });
});
