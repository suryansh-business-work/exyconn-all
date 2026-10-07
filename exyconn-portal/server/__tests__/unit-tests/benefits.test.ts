import { benefitsResolvers } from '../../src/modules/benefits';
import { BenefitModel } from '../../src/modules/benefits/benefit.model';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
type Row = { id: string; employeeId: string; kind: string; name: string };

const Query = benefitsResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = benefitsResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (id: string, roles: Role[]): GraphQLContext => ({
  user: { id, roles, email: `${id}@exyconn.com` },
});

const hr = as('hr-1', [ROLES.HR]);

const benefit = (employeeId: string, kind: string, name: string) => ({
  employeeId,
  kind,
  name,
  provider: 'Acme Insurance',
  reference: `POL-${name}`,
  coverage: 'Family',
});

describe('employee benefits', () => {
  it('lets HR record a benefit, with empty validity dates by default', async () => {
    const created = (await Mutation.createBenefit(
      null,
      { input: benefit('emp-1', 'INSURANCE', 'Health cover') },
      hr,
    )) as Row;

    const saved = await BenefitModel.findById(created.id).lean();
    expect(saved).toMatchObject({
      kind: 'INSURANCE',
      validFrom: null,
      validTo: null,
      documentUrl: null,
    });
  });

  it('refuses a kind it does not know', async () => {
    await expect(
      Mutation.createBenefit(null, { input: benefit('emp-1', 'PENSION_PLUS', 'Odd') }, hr),
    ).rejects.toThrow();
    expect(await BenefitModel.countDocuments()).toBe(0);
  });

  it('keeps an employee from recording benefits', async () => {
    await expect(
      Mutation.createBenefit(
        null,
        { input: benefit('emp-1', 'PF', 'Provident fund') },
        as('emp-1', [ROLES.EMPLOYEE]),
      ),
    ).rejects.toThrow('You do not have access to this resource');
  });

  it('shows an employee only their own benefits, ordered by kind', async () => {
    await BenefitModel.create([
      benefit('emp-1', 'WELLNESS', 'Gym'),
      benefit('emp-1', 'GRATUITY', 'Gratuity'),
      benefit('emp-2', 'INSURANCE', 'Someone else s cover'),
    ]);

    const mine = (await Query.myBenefits(null, {}, as('emp-1', [ROLES.EMPLOYEE]))) as Row[];

    expect(mine.map((row) => row.name)).toEqual(['Gratuity', 'Gym']);
    expect(mine.every((row) => row.employeeId === 'emp-1' && typeof row.id === 'string')).toBe(
      true,
    );
  });

  it('refuses to list benefits for an anonymous request', async () => {
    await expect(Query.myBenefits(null, {}, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });

  it('pages and counts the register for HR', async () => {
    await BenefitModel.create([
      benefit('emp-1', 'PF', 'Provident fund'),
      benefit('emp-2', 'PF', 'Provident fund'),
      benefit('emp-3', 'OTHER', 'Meal card'),
    ]);

    const page = (await Query.listBenefitsPaged(
      null,
      { input: { page: 0, pageSize: 10, filters: [{ field: 'kind', op: 'EQUALS', value: 'PF' }] } },
      hr,
    )) as { totalCount: number };
    const stats = (await Query.listBenefitsStats(null, {}, hr)) as {
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
    };

    expect(page.totalCount).toBe(2);
    expect(stats.counts[0].buckets).toEqual(
      expect.arrayContaining([
        { value: 'PF', count: 2 },
        { value: 'OTHER', count: 1 },
      ]),
    );
  });
});
