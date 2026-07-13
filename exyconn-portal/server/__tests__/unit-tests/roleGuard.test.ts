import { assertRole, assertAuthenticated } from '../../src/middleware/roleGuard';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const ctx = (roles?: Role[]): GraphQLContext => ({
  user: roles ? { id: '1', email: 'a@b.com', roles } : null,
});

describe('roleGuard', () => {
  it('throws UNAUTHENTICATED when there is no user', () => {
    expect(() => assertRole(ctx(), [ROLES.FINANCE])).toThrow('Authentication required');
    expect(() => assertAuthenticated(ctx())).toThrow('Authentication required');
  });

  it('allows a user holding the matching role', () => {
    expect(assertRole(ctx([ROLES.FINANCE]), [ROLES.FINANCE]).roles).toContain(ROLES.FINANCE);
  });

  it('allows when one of several roles intersects', () => {
    expect(assertRole(ctx([ROLES.HR, ROLES.FINANCE]), [ROLES.FINANCE]).roles).toContain(
      ROLES.FINANCE,
    );
  });

  it('always allows ADMIN (superuser)', () => {
    expect(assertRole(ctx([ROLES.ADMIN]), [ROLES.FINANCE]).roles).toContain(ROLES.ADMIN);
  });

  it('forbids a user whose roles do not intersect', () => {
    expect(() => assertRole(ctx([ROLES.HR]), [ROLES.FINANCE])).toThrow(
      'You do not have access to this resource',
    );
  });
});
