import type { Request } from 'express';
import {
  ORGANIZATION_HEADER,
  actingOrganization,
  resetActingOrganizationCache,
} from '../../../src/middleware/actingOrganization';
import { OrganizationModel } from '../../../src/modules/organizations/organization.model';
import { ROLES } from '../../../src/constants/roles';

const HOME = 'home-org';
const withHeader = (value?: string | string[]) =>
  ({ headers: value === undefined ? {} : { [ORGANIZATION_HEADER]: value } }) as unknown as Request;

const company = (slug: string, status = 'ACTIVE') =>
  OrganizationModel.create({ name: slug, slug, currency: 'USD', status }).then((org) =>
    org._id.toHexString(),
  );

beforeEach(() => resetActingOrganizationCache());

describe('actingOrganization', () => {
  it('keeps a caller in their own company when the address names none', async () => {
    await expect(actingOrganization(withHeader(), [ROLES.SUPER_ADMIN], HOME)).resolves.toBe(HOME);
    await expect(actingOrganization(withHeader('  '), [ROLES.SUPER_ADMIN], HOME)).resolves.toBe(
      HOME,
    );
    await expect(
      actingOrganization(withHeader(['a', 'b']), [ROLES.SUPER_ADMIN], HOME),
    ).resolves.toBe(HOME);
  });

  it('never moves anyone but a platform administrator', async () => {
    await company('acme');
    await expect(actingOrganization(withHeader('acme'), [ROLES.ADMIN], HOME)).resolves.toBe(HOME);
  });

  it('moves a platform administrator into the open company the address names', async () => {
    const acme = await company('acme');
    await expect(
      actingOrganization(withHeader('  ACME '), [ROLES.SUPER_ADMIN], null),
    ).resolves.toBe(acme);
  });

  it('keeps them home when the company is suspended or unknown', async () => {
    await company('frozen', 'SUSPENDED');
    await expect(actingOrganization(withHeader('frozen'), [ROLES.SUPER_ADMIN], HOME)).resolves.toBe(
      HOME,
    );
    await expect(
      actingOrganization(withHeader('nobody'), [ROLES.SUPER_ADMIN], null),
    ).resolves.toBeNull();
  });

  it('trusts a handle for a minute, until the cache is reset', async () => {
    const acme = await company('acme');
    const start = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(start);
    try {
      await actingOrganization(withHeader('acme'), [ROLES.SUPER_ADMIN], HOME);
      await OrganizationModel.deleteMany({});

      clock.mockReturnValue(start + 59_999);
      await expect(actingOrganization(withHeader('acme'), [ROLES.SUPER_ADMIN], HOME)).resolves.toBe(
        acme,
      );
      clock.mockReturnValue(start + 60_000);
      await expect(actingOrganization(withHeader('acme'), [ROLES.SUPER_ADMIN], HOME)).resolves.toBe(
        HOME,
      );
    } finally {
      clock.mockRestore();
    }
  });
});
