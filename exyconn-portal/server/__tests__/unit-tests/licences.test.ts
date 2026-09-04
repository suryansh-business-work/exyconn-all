import { licencesResolvers } from '../../src/modules/assets';
import { LicenceModel } from '../../src/modules/assets/licence.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asIt: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.IT], email: 'it@exyconn.com' },
};

const baseInput = {
  name: 'Figma Organization',
  vendor: 'Figma',
  seatsTotal: 2,
  cost: 45000,
  billingCycle: 'YEARLY',
  renewalDate: new Date('2027-01-31'),
  status: 'ACTIVE',
};

const create = (input: Record<string, unknown>) =>
  licencesResolvers.Mutation.createLicence(null, { input } as never, asIt);

const update = (id: string, input: Record<string, unknown>) =>
  licencesResolvers.Mutation.updateLicence(null, { id, input } as never, asIt);

describe('Licence seats', () => {
  it('records a licence with its seats assigned', async () => {
    const licence = (await create({ ...baseInput, assigneeIds: ['emp-1', 'emp-2'] })) as {
      id: string;
    };

    const saved = await LicenceModel.findById(licence.id).lean();
    expect(saved?.assigneeIds).toEqual(['emp-1', 'emp-2']);
    expect(saved?.seatsTotal).toBe(2);
  });

  it('refuses to hand out more seats than were bought', async () => {
    await expect(create({ ...baseInput, assigneeIds: ['a', 'b', 'c'] })).rejects.toThrow(
      /2 seat\(s\) — 3 people/,
    );
    expect(await LicenceModel.countDocuments()).toBe(0);
  });

  it('refuses an update that over-assigns an existing licence', async () => {
    const licence = (await create({ ...baseInput, assigneeIds: ['emp-1'] })) as { id: string };

    await expect(
      update(licence.id, { ...baseInput, assigneeIds: ['emp-1', 'emp-2', 'emp-3'] }),
    ).rejects.toThrow(/3 people are assigned/);

    const saved = await LicenceModel.findById(licence.id).lean();
    expect(saved?.assigneeIds).toEqual(['emp-1']);
  });

  it('sorts the register by what renews first', async () => {
    await create({ ...baseInput, name: 'Later', renewalDate: new Date('2027-06-01') });
    await create({ ...baseInput, name: 'Sooner', renewalDate: new Date('2027-02-01') });

    const page = (await licencesResolvers.Query.listLicencesPaged(
      null,
      { input: { page: 0, pageSize: 10 } } as never,
      asIt,
    )) as { rows: Array<{ name: string }> };

    expect(page.rows.map((row) => row.name)).toEqual(['Sooner', 'Later']);
  });
});
