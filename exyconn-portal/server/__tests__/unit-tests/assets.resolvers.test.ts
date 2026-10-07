import { assetsResolvers, licencesService } from '../../src/modules/assets';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: 'caller-1', roles, email: 'caller@exyconn.com' },
});

type Assignee = { id: string; name: string; email: string };

const itStaff = as([ROLES.IT]);
const employee = as([ROLES.EMPLOYEE]);

const person = (name: string) =>
  UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.com`,
    passwordHash: 'x',
    roles: [ROLES.EMPLOYEE],
  });

const licence = (name: string, renewalDate: string, assigneeIds: string[]) =>
  licencesService.create({
    name,
    vendor: `${name} Inc`,
    seatsTotal: 5,
    assigneeIds,
    cost: 100,
    billingCycle: 'YEARLY',
    renewalDate: new Date(renewalDate),
    status: 'ACTIVE',
  });

describe('the asset assignee picker', () => {
  it('lists everybody by name, with only what a row needs', async () => {
    await person('Zoe');
    await person('Asha');

    const listed = (await assetsResolvers.Query.listAssetAssignees(
      null,
      {},
      itStaff,
    )) as unknown as Assignee[];

    expect(listed.map((row) => row.name)).toEqual(['Asha', 'Zoe']);
    expect(listed[0]).toMatchObject({ email: 'asha@exyconn.com', id: expect.any(String) });
    expect(listed[0]).not.toHaveProperty('passwordHash');
  });

  it('is closed to somebody outside IT', async () => {
    await expect(assetsResolvers.Query.listAssetAssignees(null, {}, employee)).rejects.toThrow(
      'You do not have access to this resource',
    );
  });
});

describe('licence seats for one employee', () => {
  it('lists the licences they hold a seat on, soonest renewal first', async () => {
    await licence('Slack', '2027-05-01', ['emp-1', 'emp-2']);
    await licence('Figma', '2027-02-01', ['emp-1']);
    await licence('Notion', '2027-01-01', ['emp-2']);

    const seats = await assetsResolvers.Query.licenceSeatsFor(
      null,
      { employeeId: 'emp-1' },
      itStaff,
    );

    expect(seats.map((row) => row.name)).toEqual(['Figma', 'Slack']);
    expect(seats[0]).toMatchObject({
      vendor: 'Figma Inc',
      status: 'ACTIVE',
      id: expect.any(String),
    });
  });

  it('is empty for somebody who holds no seat', async () => {
    await licence('Slack', '2027-05-01', ['emp-1']);

    await expect(
      assetsResolvers.Query.licenceSeatsFor(null, { employeeId: 'emp-9' }, itStaff),
    ).resolves.toEqual([]);
  });

  it('is closed to somebody outside IT', async () => {
    await expect(
      assetsResolvers.Query.licenceSeatsFor(null, { employeeId: 'emp-1' }, employee),
    ).rejects.toThrow('You do not have access to this resource');
  });
});

describe('asset assignment history access', () => {
  it('is closed to somebody outside IT', async () => {
    await expect(
      assetsResolvers.Query.assetAssignments(null, { assetId: 'a-1' }, employee),
    ).rejects.toThrow('You do not have access to this resource');
  });

  it('is empty for an asset nobody has held', async () => {
    await expect(
      assetsResolvers.Query.assetAssignments(null, { assetId: 'a-1' }, itStaff),
    ).resolves.toEqual([]);
  });
});

describe('asset fields added after the first assets were registered', () => {
  const { installedSoftware, edrStatus } = assetsResolvers.Asset;

  it('reads missing installed software as none', () => {
    expect(installedSoftware({})).toEqual([]);
    expect(installedSoftware({ installedSoftware: null })).toEqual([]);
    expect(installedSoftware({ installedSoftware: ['Chrome', 'Zoom'] })).toEqual([
      'Chrome',
      'Zoom',
    ]);
  });

  it('reads a missing EDR status as not applicable', () => {
    expect(edrStatus({})).toBe('NOT_APPLICABLE');
    expect(edrStatus({ edrStatus: null })).toBe('NOT_APPLICABLE');
    expect(edrStatus({ edrStatus: 'PROTECTED' })).toBe('PROTECTED');
  });
});
