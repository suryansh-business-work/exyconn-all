import { assertMayAssignRoles } from '../../src/modules/admin/admin.service';
import { ROLES } from '../../src/constants/roles';

/**
 * Opening user creation to HR is what makes one shared employee database real. It must not
 * also be a way to become an administrator, so these are the boundaries of that opening.
 */
describe('who may assign which roles', () => {
  it('lets HR create an ordinary employee', () => {
    expect(() => assertMayAssignRoles([ROLES.HR], [ROLES.EMPLOYEE, ROLES.TRACKER])).not.toThrow();
  });

  it('stops HR granting the ADMIN role', () => {
    expect(() => assertMayAssignRoles([ROLES.HR], [ROLES.EMPLOYEE, ROLES.ADMIN])).toThrow(
      /administrator can grant/i,
    );
  });

  it('stops HR editing an existing administrator at all', () => {
    // Not just the roles field: an HR user must not be able to reset an admin's email either.
    expect(() => assertMayAssignRoles([ROLES.HR], undefined, [ROLES.ADMIN])).toThrow(
      /administrator can change/i,
    );
  });

  it('lets an ADMIN do both', () => {
    expect(() => assertMayAssignRoles([ROLES.ADMIN], [ROLES.ADMIN], [ROLES.ADMIN])).not.toThrow();
  });

  it('allows an edit that does not touch roles', () => {
    expect(() => assertMayAssignRoles([ROLES.HR], undefined, [ROLES.EMPLOYEE])).not.toThrow();
  });
});
