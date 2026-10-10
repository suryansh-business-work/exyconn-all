import { assertGrantableRoles } from '../../../../src/modules/integrations/integrations.resolvers';
import { ROLES } from '../../../../src/constants/roles';

describe('assertGrantableRoles', () => {
  it('refuses a role that is not a company role, whoever asks', () => {
    expect(() => assertGrantableRoles([ROLES.ADMIN], [ROLES.SUPER_ADMIN])).toThrow(
      'Not a role an API key may be granted: SUPER_ADMIN',
    );
  });

  it('lets an administrator grant any company role', () => {
    expect(() => assertGrantableRoles([ROLES.ADMIN], [ROLES.FINANCE, ROLES.HR])).not.toThrow();
  });

  it('never lets a key carry a role its creator does not hold', () => {
    expect(() => assertGrantableRoles([ROLES.HR], [ROLES.HR, ROLES.FINANCE])).toThrow(
      'A key cannot carry a role you do not hold: FINANCE',
    );
  });

  it('lets a creator grant a subset of the roles they hold', () => {
    expect(() => assertGrantableRoles([ROLES.HR, ROLES.FINANCE], [ROLES.FINANCE])).not.toThrow();
  });
});
