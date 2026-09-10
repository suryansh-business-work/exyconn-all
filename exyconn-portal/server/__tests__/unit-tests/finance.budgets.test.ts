import { CostCenterModel } from '../../src/modules/finance/cost-center.model';
import { BudgetModel } from '../../src/modules/finance/budget.model';
import { CompanyExpenseModel } from '../../src/modules/finance/company-expense.model';
import { budgetVsActual } from '../../src/modules/finance/finance.budgets';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const FROM = day('2026-03-01');
const TO = day('2026-03-31');

const centre = (code: string, name: string) => CostCenterModel.create({ code, name });

const budget = (costCenterId: string, month: string, amount: number) =>
  BudgetModel.create({ costCenterId, month, amount, currency: 'INR' });

const bill = (costCenterId: string, amount: number, on = '2026-03-10') =>
  CompanyExpenseModel.create({
    vendor: 'Acme',
    category: 'SOFTWARE',
    amount,
    currency: 'INR',
    costCenterId,
    incurredOn: day(on),
    dueDate: day('2026-04-10'),
  });

describe('budget against actual', () => {
  it('reports what is left when a centre is under its budget', async () => {
    const eng = await centre('ENG', 'Engineering');
    await budget(String(eng._id), '2026-03', 10_000);
    await bill(String(eng._id), 4000);

    const [row] = await budgetVsActual(FROM, TO);

    expect(row.code).toBe('ENG');
    expect(row.budgeted).toBe(10_000);
    expect(row.actual).toBe(4000);
    expect(row.variance).toBe(6000);
    expect(row.utilisation).toBe(40);
  });

  it('reports an overspend as a negative variance', async () => {
    const mkt = await centre('MKT', 'Marketing');
    await budget(String(mkt._id), '2026-03', 5000);
    await bill(String(mkt._id), 7500);

    const [row] = await budgetVsActual(FROM, TO);

    expect(row.variance).toBe(-2500);
    expect(row.utilisation).toBe(150);
  });

  it('sums every month the window touches', async () => {
    const eng = await centre('ENG', 'Engineering');
    await budget(String(eng._id), '2026-03', 1000);
    await budget(String(eng._id), '2026-04', 2000);
    await budget(String(eng._id), '2026-05', 4000);

    const [row] = await budgetVsActual(FROM, day('2026-04-30'));

    // March and April count; May is outside the window.
    expect(row.budgeted).toBe(3000);
  });

  it('leaves utilisation null where there is no budget to be a percentage of', async () => {
    const ops = await centre('OPS', 'Operations');
    await bill(String(ops._id), 900);

    const [row] = await budgetVsActual(FROM, TO);

    expect(row.budgeted).toBe(0);
    expect(row.actual).toBe(900);
    expect(row.utilisation).toBeNull();
  });

  it('gives untagged spend its own row so the actuals still add up', async () => {
    const eng = await centre('ENG', 'Engineering');
    await budget(String(eng._id), '2026-03', 1000);
    await bill(String(eng._id), 600);
    await bill('', 250);

    const rows = await budgetVsActual(FROM, TO);
    const total = rows.reduce((sum, row) => sum + row.actual, 0);

    expect(rows.map((r) => r.name)).toEqual(['Engineering', 'Unallocated']);
    expect(total).toBe(850);
    expect(rows[1].costCenterId).toBe('');
  });

  it('leaves out a centre with no money either way', async () => {
    const eng = await centre('ENG', 'Engineering');
    await centre('OLD', 'Retired team');
    await budget(String(eng._id), '2026-03', 1000);

    const rows = await budgetVsActual(FROM, TO);

    expect(rows.map((r) => r.code)).toEqual(['ENG']);
  });

  it('counts only spend inside the window', async () => {
    const eng = await centre('ENG', 'Engineering');
    await budget(String(eng._id), '2026-03', 1000);
    await bill(String(eng._id), 500, '2026-03-15');
    await bill(String(eng._id), 700, '2026-04-02');

    const [row] = await budgetVsActual(FROM, TO);

    expect(row.actual).toBe(500);
  });

  it('refuses two budgets for the same centre and month', async () => {
    const eng = await centre('ENG', 'Engineering');
    await budget(String(eng._id), '2026-03', 1000);

    await expect(budget(String(eng._id), '2026-03', 2000)).rejects.toThrow();
  });
});
