import { financeBudgetResolvers } from '../../../../src/modules/finance';
import { CostCenterModel } from '../../../../src/modules/finance/cost-center.model';
import { BudgetModel } from '../../../../src/modules/finance/budget.model';
import { CompanyExpenseModel } from '../../../../src/modules/finance/company-expense.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

const asFinance: GraphQLContext = {
  user: { id: 'fin-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};
const asHr: GraphQLContext = {
  user: { id: 'hr-1', roles: [ROLES.HR], email: 'hr@exyconn.com' },
};

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<Record<string, unknown>>;
const M = financeBudgetResolvers.Mutation as unknown as Record<string, Resolver>;

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const MARCH = { from: day('2026-03-01'), to: day('2026-03-31') };

const report = (period: { from: Date; to: Date }, ctx = asFinance) =>
  financeBudgetResolvers.Query.budgetVsActual(null, period, ctx);

describe('budget field resolvers', () => {
  it('blanks the fields older rows were written without', () => {
    expect(financeBudgetResolvers.CompanyExpense.costCenterId({})).toBe('');
    expect(financeBudgetResolvers.CompanyExpense.costCenterId({ costCenterId: null })).toBe('');
    expect(financeBudgetResolvers.CostCenter.ownerId({})).toBe('');
    expect(financeBudgetResolvers.CostCenter.description({ description: null })).toBe('');
  });

  it('passes stored values through', () => {
    expect(financeBudgetResolvers.CompanyExpense.costCenterId({ costCenterId: 'cc-1' })).toBe(
      'cc-1',
    );
    expect(financeBudgetResolvers.CostCenter.ownerId({ ownerId: 'user-9' })).toBe('user-9');
    expect(financeBudgetResolvers.CostCenter.description({ description: 'Platform' })).toBe(
      'Platform',
    );
  });
});

describe('budgetVsActual resolver', () => {
  it('reports budget against actual for finance', async () => {
    const centre = await CostCenterModel.create({ code: 'eng', name: 'Engineering' });
    await BudgetModel.create({
      costCenterId: centre._id.toHexString(),
      month: '2026-03',
      amount: 1000,
      currency: 'USD',
    });

    const rows = await report(MARCH);

    expect(rows).toEqual([
      {
        costCenterId: centre._id.toHexString(),
        code: 'ENG',
        name: 'Engineering',
        budgeted: 1000,
        actual: 0,
        variance: 1000,
        utilisation: 0,
      },
    ]);
  });

  it('files spend from before cost centres existed under Unallocated', async () => {
    const bill = await CompanyExpenseModel.create({
      vendor: 'Acme',
      category: 'RENT',
      amount: 320,
      currency: 'USD',
      incurredOn: day('2026-03-05'),
      dueDate: day('2026-04-05'),
    });
    await CompanyExpenseModel.collection.updateOne(
      { _id: bill._id },
      { $unset: { costCenterId: '' } },
    );

    const rows = await report(MARCH);

    expect(rows).toEqual([
      {
        costCenterId: '',
        code: '—',
        name: 'Unallocated',
        budgeted: 0,
        actual: 320,
        variance: -320,
        utilisation: null,
      },
    ]);
  });

  it('reports nothing for a quiet period', async () => {
    await expect(report(MARCH)).resolves.toEqual([]);
  });

  it('refuses a period that runs backwards', () => {
    expect(() => report({ from: MARCH.to, to: MARCH.from })).toThrow(/must not be after/);
  });

  it('is closed to anybody outside finance', () => {
    expect(() => report(MARCH, asHr)).toThrow(/do not have access/);
  });
});

describe('cost centre and budget writes', () => {
  it('stores a cost centre code upper-cased and a budget against it', async () => {
    const centre = await M.createCostCenter(
      null,
      { input: { code: ' mkt-apac ', name: 'Marketing APAC', isActive: true } },
      asFinance,
    );
    const budget = await M.createBudget(
      null,
      {
        input: {
          costCenterId: String(centre.id),
          month: '2026-04',
          amount: 2500,
          currency: 'usd',
        },
      },
      asFinance,
    );

    expect(centre).toMatchObject({ code: 'MKT-APAC', name: 'Marketing APAC' });
    expect(budget).toMatchObject({ month: '2026-04', amount: 2500, currency: 'USD' });
  });

  it('refuses a budget month that is not YYYY-MM', async () => {
    await expect(
      M.createBudget(
        null,
        { input: { costCenterId: 'cc-1', month: 'April', amount: 1, currency: 'USD' } },
        asFinance,
      ),
    ).rejects.toThrow();
    expect(await BudgetModel.countDocuments()).toBe(0);
  });
});
