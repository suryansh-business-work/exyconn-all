import { payrollResolvers } from '../../../../src/modules/payroll';
import { SalaryStructureModel } from '../../../../src/modules/employee/salary.model';
import { TaxRegimeModel } from '../../../../src/modules/payroll/tax-slab.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization({ currency: 'INR', locale: 'en-IN', taxSystem: 'INDIA_GST' });

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = payrollResolvers.Query as unknown as Record<string, Resolver>;
const M = payrollResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (id: string, roles: string[]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;
const hr = as('hr-1', [ROLES.HR]);
const finance = as('fin-1', [ROLES.FINANCE]);
const employee = as('emp-1', [ROLES.EMPLOYEE]);

const pay = {
  currency: 'INR',
  basic: 30_000,
  hra: 10_000,
  allowances: 5_000,
  deductions: 1_000,
  effectiveFrom: new Date('2026-04-01T00:00:00.000Z'),
};

const audits = () => AuditLogModel.find({ module: 'SalaryStructure' }).sort({ _id: 1 }).lean();

describe('employeeSalary', () => {
  it('is null until HR has set a structure up, then returns it with its id', async () => {
    await expect(Q.employeeSalary(null, { employeeId: 'emp-9' }, finance)).resolves.toBeNull();
    const saved = await SalaryStructureModel.create({ ...pay, employeeId: 'emp-9' });

    const found = (await Q.employeeSalary(null, { employeeId: 'emp-9' }, finance)) as {
      id: string;
      basic: number;
    };
    expect(found).toMatchObject({ id: saved._id.toHexString(), basic: 30_000 });
  });

  it('is refused to a plain employee', async () => {
    await expect(Q.employeeSalary(null, { employeeId: 'emp-1' }, employee)).rejects.toThrow();
  });
});

describe('saveEmployeeSalary', () => {
  it('creates the structure, then replaces it, auditing what moved each time', async () => {
    const created = (await M.saveEmployeeSalary(null, { employeeId: 'emp-9', input: pay }, hr)) as {
      id: string;
    };
    const updated = (await M.saveEmployeeSalary(
      null,
      { employeeId: 'emp-9', input: { ...pay, basic: 35_000 } },
      hr,
    )) as { id: string; basic: number };

    expect(updated).toMatchObject({ id: created.id, basic: 35_000 });
    expect(await SalaryStructureModel.countDocuments({ employeeId: 'emp-9' })).toBe(1);
    const [first, second] = await audits();
    expect(first).toMatchObject({ action: 'CREATE', entityLabel: 'emp-9', entityId: created.id });
    expect(second.action).toBe('UPDATE');
    expect(second.summary).toBe('Saved the salary of employee emp-9 (basic)');
  });

  it('says so when a save changed nothing', async () => {
    await M.saveEmployeeSalary(null, { employeeId: 'emp-9', input: pay }, hr);
    await M.saveEmployeeSalary(null, { employeeId: 'emp-9', input: pay }, hr);

    const [, second] = await audits();
    expect(second.summary).toBe('Saved the salary of employee emp-9 (no changes)');
  });

  it('stores a regime on file and refuses one that is not', async () => {
    await TaxRegimeModel.create({ regimeKey: 'OLD', financialYear: '2026-27', name: 'Old' });

    await expect(
      M.saveEmployeeSalary(
        null,
        { employeeId: 'emp-9', input: { ...pay, taxRegimeKey: 'OLD' } },
        hr,
      ),
    ).resolves.toMatchObject({ taxRegimeKey: 'OLD' });
    await expect(
      M.saveEmployeeSalary(
        null,
        { employeeId: 'emp-9', input: { ...pay, taxRegimeKey: 'GHOST', basic: 1 } },
        hr,
      ),
    ).rejects.toThrow(/no tax regime "GHOST"/);
    expect((await SalaryStructureModel.findOne({ employeeId: 'emp-9' }).lean())?.basic).toBe(
      30_000,
    );
  });
});

describe('createSalaryStructure / updateSalaryStructure', () => {
  it('runs the generic create through the same regime check as the dedicated save', async () => {
    await expect(
      M.createSalaryStructure(
        null,
        { input: { ...pay, employeeId: 'emp-9', taxRegimeKey: 'X' } },
        hr,
      ),
    ).rejects.toThrow(/no tax regime "X"/);

    const created = (await M.createSalaryStructure(
      null,
      { input: { ...pay, employeeId: 'emp-9', taxRegimeKey: '  ' } },
      hr,
    )) as { id: string; taxRegimeKey: string | null };
    expect(created.taxRegimeKey).toBeNull();
  });

  it('refuses HR writing their own structure, including through the stored record', async () => {
    // The create guard refuses before any write starts, so it throws rather than rejecting.
    expect(() =>
      M.createSalaryStructure(null, { input: { ...pay, employeeId: 'hr-1' } }, hr),
    ).toThrow(/for yourself/);

    const own = await SalaryStructureModel.create({ ...pay, employeeId: 'hr-1' });
    await expect(
      M.updateSalaryStructure(null, { id: own._id.toHexString(), input: { basic: 99_999 } }, hr),
    ).rejects.toThrow(/for yourself/);
    expect((await SalaryStructureModel.findById(own._id).lean())?.basic).toBe(30_000);
  });

  it('lets HR revise somebody else’s structure', async () => {
    const other = await SalaryStructureModel.create({ ...pay, employeeId: 'emp-9' });
    await expect(
      M.updateSalaryStructure(null, { id: other._id.toHexString(), input: { basic: 31_000 } }, hr),
    ).resolves.toMatchObject({ basic: 31_000 });
  });
});

describe('taxRegimeChoices', () => {
  it('lists the regimes to Finance, which may set a salary, and refuses an employee', async () => {
    await TaxRegimeModel.create({ regimeKey: 'NEW', financialYear: '2026-27', name: 'New' });

    await expect(Q.taxRegimeChoices(null, {}, finance)).resolves.toEqual([
      { regimeKey: 'NEW', name: 'New', active: true },
    ]);
    await expect(Q.taxRegimeChoices(null, {}, employee)).rejects.toThrow();
  });
});
