import { financeResolvers, GST_STATES } from '../../../../src/modules/finance';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { updateBranding } from '../../../../src/modules/branding/branding.service';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

const asFinance: GraphQLContext = {
  user: { id: 'fin-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};
const asEmployee: GraphQLContext = {
  user: { id: 'emp-1', roles: [ROLES.EMPLOYEE], email: 'emp@exyconn.com' },
};

const LINE = { description: 'Design', quantity: 2, rate: 1000, taxPercent: 18 };
const I = financeResolvers.Invoice;

const baseInput = {
  number: 'INV-500',
  currency: 'USD',
  status: 'DRAFT',
  issuedDate: new Date('2026-09-01T00:00:00.000Z'),
  dueDate: new Date('2026-09-30T00:00:00.000Z'),
};

const seedClient = async () =>
  (
    await ClientModel.create({
      name: 'Priya',
      email: 'priya@acme.test',
      company: 'Acme',
      status: 'ACTIVE',
    })
  )._id.toHexString();

const create = (input: Record<string, unknown>, ctx = asFinance) =>
  financeResolvers.Mutation.createInvoice(
    null,
    { input: { ...baseInput, ...input } } as never,
    ctx,
  ) as Promise<{ id: string }>;

describe('invoice line field resolvers', () => {
  it('derives the line amount, tax included', () => {
    expect(financeResolvers.InvoiceLine.amount(LINE)).toBe(2360);
  });

  it('blanks an HSN/SAC the line was written without', () => {
    expect(financeResolvers.InvoiceLine.hsnSac({})).toBe('');
    expect(financeResolvers.InvoiceLine.hsnSac({ hsnSac: null })).toBe('');
    expect(financeResolvers.InvoiceLine.hsnSac({ hsnSac: '998314' })).toBe('998314');
  });
});

describe('invoice field resolvers', () => {
  it('fills every field an older invoice row comes back without', () => {
    const legacy = {};

    expect(I.clientName(legacy)).toBe('');
    expect(I.lines(legacy)).toEqual([]);
    expect(I.dealId(legacy)).toBe('');
    expect(I.placeOfSupplyStateCode(legacy)).toBe('');
    expect(I.supplierStateCode(legacy)).toBe('');
    expect([I.subtotal(legacy), I.taxTotal(legacy), I.cgst(legacy), I.sgst(legacy)]).toEqual([
      0, 0, 0, 0,
    ]);
    expect(I.igst(legacy)).toBe(0);
  });

  it('passes stored values through and splits the tax for another state', () => {
    const row = {
      clientName: 'Acme',
      lines: [LINE],
      dealId: 'deal-1',
      placeOfSupplyStateCode: '27',
      supplierStateCode: '23',
    };

    expect(I.clientName(row)).toBe('Acme');
    expect(I.lines(row)).toEqual([LINE]);
    expect(I.dealId(row)).toBe('deal-1');
    expect(I.placeOfSupplyStateCode(row)).toBe('27');
    expect(I.supplierStateCode(row)).toBe('23');
    expect(I.subtotal(row)).toBe(2000);
    expect(I.taxTotal(row)).toBe(360);
    expect(I.igst(row)).toBe(360);
    expect(I.cgst(row)).toBe(0);
    expect(I.sgst(row)).toBe(0);
  });
});

describe('gstStates', () => {
  it('hands any signed-in user the configured state list', () => {
    expect(financeResolvers.Query.gstStates(null, {}, asEmployee)).toBe(GST_STATES);
  });

  it('refuses somebody who is not signed in', () => {
    expect(() => financeResolvers.Query.gstStates(null, {}, { user: null })).toThrow(
      /Authentication required/,
    );
  });
});

describe('createInvoice', () => {
  it('stamps our GST state from Branding and blanks a missing place of supply', async () => {
    await updateBranding({ stateCode: '23' });
    const clientId = await seedClient();

    const saved = await create({ clientId, amount: 900, placeOfSupplyStateCode: null });

    const stored = await InvoiceModel.findById(saved.id).lean();
    expect(stored).toMatchObject({
      clientName: 'Priya',
      amount: 900,
      supplierStateCode: '23',
      placeOfSupplyStateCode: '',
      lines: [],
    });
  });

  it('ignores a supplier state the form sends, keeping the one Branding holds', async () => {
    await updateBranding({ stateCode: '27' });
    const clientId = await seedClient();

    const saved = await create({ clientId, amount: 100, supplierStateCode: '07' });

    expect((await InvoiceModel.findById(saved.id).lean())?.supplierStateCode).toBe('27');
  });

  it('refuses a caller without finance access before looking the client up', async () => {
    await expect(create({ clientId: 'no-such-client', amount: 100 }, asEmployee)).rejects.toThrow(
      /do not have access/,
    );
    expect(await InvoiceModel.countDocuments()).toBe(0);
  });
});

describe('updateInvoice', () => {
  const update = (id: string, input: Record<string, unknown>, ctx = asFinance) =>
    financeResolvers.Mutation.updateInvoice(
      null,
      { id, input: { ...baseInput, ...input } } as never,
      ctx,
    ) as Promise<{ amount: number }>;

  it('re-settles the amount from the lines on every edit', async () => {
    const clientId = await seedClient();
    const saved = await create({ clientId, amount: 100 });

    const updated = await update(saved.id, { clientId, amount: 5, lines: [LINE] });

    expect(updated.amount).toBe(2360);
  });

  it('refuses a caller without finance access', async () => {
    const clientId = await seedClient();
    const saved = await create({ clientId, amount: 100 });

    await expect(update(saved.id, { clientId, amount: 200 }, asEmployee)).rejects.toThrow(
      /do not have access/,
    );
    expect((await InvoiceModel.findById(saved.id).lean())?.amount).toBe(100);
  });

  it('refuses an edit that leaves neither an amount nor a line', async () => {
    const clientId = await seedClient();
    const saved = await create({ clientId, amount: 100 });

    await expect(update(saved.id, { clientId, amount: null, lines: [] })).rejects.toThrow(
      /Enter an amount/,
    );
  });
});
