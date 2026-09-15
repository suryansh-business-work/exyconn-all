import { Types } from 'mongoose';
import { runAsPlatform, runForOrganization } from '../../src/lib/tenant';
import { createCrudService } from '../../src/lib/crudService';
import { OrganizationModel } from '../../src/modules/organizations';
import {
  repairStoredCurrencies,
  repairedCurrency,
} from '../../src/modules/organizations/organization.currency';
import { BudgetModel } from '../../src/modules/finance/budget.model';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { SalaryStructureModel } from '../../src/modules/employee/salary.model';
import { employeeRates } from '../../src/modules/tracker/tracker.billing.pricing';
import { normalizeCurrency } from '../../src/utils/iso';
import { formatAmount } from '../../src/utils/money';

async function organization(slug: string, currency: string): Promise<string> {
  const created = await runAsPlatform(() =>
    OrganizationModel.create({ name: slug, slug, currency }),
  );
  return String(created._id);
}

/** Writes straight to the collection, the way records got in before currencies were checked. */
async function legacyBudget(organizationId: string, currency: string): Promise<Types.ObjectId> {
  const _id = new Types.ObjectId();
  await BudgetModel.collection.insertOne({
    _id,
    organizationId: new Types.ObjectId(organizationId),
    costCenterId: 'ENG',
    month: '2026-03',
    amount: 1000,
    currency,
  });
  return _id;
}

async function storedCurrency(id: Types.ObjectId): Promise<unknown> {
  const raw = await BudgetModel.collection.findOne({ _id: id });
  return raw?.currency;
}

describe('normalizeCurrency', () => {
  it('reads a stored code as the ISO 4217 code Intl needs', () => {
    expect(normalizeCurrency('INR')).toBe('INR');
    expect(normalizeCurrency(' inr ')).toBe('INR');
  });

  it('names no currency for anything that is not one', () => {
    for (const value of [null, undefined, '', '₹', 'Rs', 'Rupee', 'XYZ']) {
      expect(normalizeCurrency(value)).toBeNull();
    }
  });
});

describe('formatAmount', () => {
  it('writes money in the record currency and the company notation', () => {
    expect(formatAmount(82_500, 'INR', 'en-IN')).toBe('₹82,500.00');
    expect(formatAmount(82_500, 'eur', 'de-DE')).toContain('€');
  });

  it('prints the bare figure instead of throwing on a currency that is not ISO 4217', () => {
    expect(formatAmount(82_500, '', 'en-IN')).toBe('82,500.00');
    expect(formatAmount(82_500, '₹', 'en-IN')).toBe('82,500.00');
  });
});

describe('the stored currency of a money record', () => {
  const invoice = (currency: string) => ({
    number: 'INV-001',
    clientId: 'client-1',
    amount: 100,
    currency,
    issuedDate: new Date('2026-03-01'),
    dueDate: new Date('2026-03-31'),
  });

  it('is stored trimmed and upper-cased', async () => {
    const budget = await BudgetModel.create({
      costCenterId: 'ENG',
      month: '2026-03',
      amount: 1,
      currency: ' usd ',
    });
    expect(budget.currency).toBe('USD');
  });

  it('refuses a value that is not an ISO 4217 code on create', async () => {
    await expect(
      BudgetModel.create({ costCenterId: 'ENG', month: '2026-03', amount: 1, currency: '₹' }),
    ).rejects.toThrow(/ISO 4217/);
    await expect(InvoiceModel.create(invoice(''))).rejects.toThrow(/currency/);
    await expect(InvoiceModel.create(invoice('eur'))).resolves.toMatchObject({ currency: 'EUR' });
  });

  it('refuses one on update through the shared CRUD service too', async () => {
    const budgets = createCrudService<{ currency: string }>(BudgetModel as never, 'Budget');
    const budget = await BudgetModel.create({
      costCenterId: 'ENG',
      month: '2026-03',
      amount: 1,
      currency: 'INR',
    });
    await expect(budgets.update(String(budget._id), { currency: 'Rupee' })).rejects.toThrow(
      /ISO 4217/,
    );
  });
});

describe('repairing stored currencies', () => {
  it('maps what people typed to the code they meant', () => {
    expect(repairedCurrency('inr ', 'EUR')).toBe('INR');
    for (const rupees of ['₹', 'Rs', 'RUPEE', 'rupees']) {
      expect(repairedCurrency(rupees, 'EUR')).toBe('INR');
    }
    for (const unknown of ['', 'dollars', null, undefined]) {
      expect(repairedCurrency(unknown, 'EUR')).toBe('EUR');
    }
  });

  it('rewrites only the wrong records, and only in the organization in scope', async () => {
    const acme = await organization('acme', 'EUR');
    const globex = await organization('globex', 'USD');
    const lower = await legacyBudget(acme, 'inr ');
    const symbol = await legacyBudget(acme, '₹');
    const empty = await legacyBudget(acme, '');
    const valid = await legacyBudget(acme, 'GBP');
    const theirs = await legacyBudget(globex, '');

    const repaired = await runForOrganization(acme, repairStoredCurrencies);

    expect(repaired).toBe(3);
    expect(await storedCurrency(lower)).toBe('INR');
    expect(await storedCurrency(symbol)).toBe('INR');
    expect(await storedCurrency(empty)).toBe('EUR');
    expect(await storedCurrency(valid)).toBe('GBP');
    expect(await storedCurrency(theirs)).toBe('');
    // A second boot has nothing left to do.
    expect(await runForOrganization(acme, repairStoredCurrencies)).toBe(0);
  });
});

describe('tracker billing', () => {
  it('bills a salary structure stored with no usable currency in the company one', async () => {
    const acme = await organization('acme', 'EUR');
    const employeeId = String(new Types.ObjectId());
    await SalaryStructureModel.collection.insertOne({
      organizationId: new Types.ObjectId(acme),
      employeeId,
      currency: '',
      billingRate: 50,
    });

    const rates = await runForOrganization(acme, () => employeeRates([employeeId]));

    expect(rates.get(employeeId)?.currency).toBe('EUR');
  });
});
