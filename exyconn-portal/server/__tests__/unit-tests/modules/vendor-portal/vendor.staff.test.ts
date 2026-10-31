import { Types } from 'mongoose';
import { vendorPortalResolvers } from '../../../../src/modules/vendor-portal';
import { VendorContactModel } from '../../../../src/modules/vendor-portal/vendor-contact.model';
import { VendorInvoiceModel } from '../../../../src/modules/vendor-portal/vendor-invoice.model';
import { CompanyExpenseModel } from '../../../../src/modules/finance/company-expense.model';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { emailer } from '../../../../src/modules/email/email.service';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { runForOrganization } from '../../../../src/lib/tenant';
import { logger } from '../../../../src/utils/logger';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { MISSING, PAGE, seedInvoice, seedSupplier } from './vendor.fixtures';

const organizationId = useTestOrganization();
const otherCompany = new Types.ObjectId().toHexString();
const { Query, Mutation } = vendorPortalResolvers;

const staff = (roles: Role[]): GraphQLContext => ({
  user: { id: 'u1', email: 'reviewer@exyconn.com', roles, organizationId },
});
const products = staff([ROLES.PRODUCTS]);
const finance = staff([ROLES.FINANCE]);

let supplierId: string;
let send: jest.SpyInstance;

beforeEach(async () => {
  invalidatePermissionCache();
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  supplierId = await seedSupplier('Widgets Ltd', 'WID');
});

afterEach(() => {
  jest.restoreAllMocks();
});

const contactInput = (over: Record<string, unknown> = {}) => ({
  input: { supplierId, name: ' Sam Patel ', email: ' Sam@Widgets.TEST ', ...over },
});

describe('vendor contacts', () => {
  it('gives a supplier contact access, emails the invite and audits it', async () => {
    const contact = await Mutation.addVendorContact(null, contactInput(), products);

    expect(contact).toMatchObject({
      supplierId,
      name: 'Sam Patel',
      email: 'sam@widgets.test',
      active: true,
      signInCount: 0,
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'vendor-portal-invite',
        to: 'sam@widgets.test',
        variables: {
          name: 'Sam Patel',
          supplierName: 'Widgets Ltd',
          portalUrl: 'https://vendors.exyconn.com',
        },
      }),
    );
    const audit = await AuditLogModel.findOne({ module: 'Supplier' }).lean();
    expect(audit?.summary).toBe('Gave sam@widgets.test vendor portal access');
    expect(await Query.vendorContacts(null, { supplierId }, products)).toEqual([
      expect.objectContaining({ id: contact.id, email: 'sam@widgets.test' }),
    ]);
  });

  it('still gives access when the invite email fails, and logs the failure', async () => {
    send.mockRejectedValueOnce(new Error('SMTP down'));
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    await Mutation.addVendorContact(null, contactInput(), products);

    expect(await VendorContactModel.countDocuments()).toBe(1);
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Vendor portal invite email failed',
    );
  });

  it.each([
    ['a blank name', { name: '  ' }, /person’s name/],
    ['a name over 120 characters', { name: 'n'.repeat(121) }, /person’s name/],
    ['an invalid address', { email: 'not-an-email' }, /valid email/],
    ['a supplier that does not exist', { supplierId: MISSING }, /Supplier not found/],
  ])('refuses %s', async (_label, over, message) => {
    await expect(Mutation.addVendorContact(null, contactInput(over), products)).rejects.toThrow(
      message,
    );
    expect(await VendorContactModel.countDocuments()).toBe(0);
  });

  it('refuses an address that already has access, even at another company', async () => {
    await runForOrganization(otherCompany, () =>
      VendorContactModel.create({ supplierId: 's9', name: 'Sam', email: 'sam@widgets.test' }),
    );

    await expect(Mutation.addVendorContact(null, contactInput(), products)).rejects.toThrow(
      /already has vendor portal access/,
    );
  });

  it('switches access off (retiring every pass) and back on', async () => {
    const { id } = await Mutation.addVendorContact(null, contactInput(), products);

    const off = await Mutation.setVendorContactActive(null, { id, active: false }, products);
    expect(off).toMatchObject({ active: false, tokenVersion: 1 });
    const on = await Mutation.setVendorContactActive(null, { id, active: true }, products);
    expect(on).toMatchObject({ active: true, tokenVersion: 1 });

    const summaries = (await AuditLogModel.find({ action: 'UPDATE' }).lean()).map(
      (row) => row.summary,
    );
    expect(summaries).toEqual(
      expect.arrayContaining([
        'Switched off vendor portal access for sam@widgets.test',
        'Restored vendor portal access for sam@widgets.test',
      ]),
    );
  });

  it('removes access for good', async () => {
    const { id } = await Mutation.addVendorContact(null, contactInput(), products);

    expect(await Mutation.deleteVendorContact(null, { id }, products)).toBe(true);
    expect(await VendorContactModel.countDocuments()).toBe(0);
    expect((await AuditLogModel.findOne({ action: 'DELETE' }).lean())?.summary).toBe(
      'Removed vendor portal access for sam@widgets.test',
    );
  });

  it('treats an unknown contact as not found', async () => {
    await expect(
      Mutation.setVendorContactActive(null, { id: MISSING, active: false }, products),
    ).rejects.toThrow(/Vendor contact not found/);
    await expect(Mutation.deleteVendorContact(null, { id: MISSING }, products)).rejects.toThrow(
      /Vendor contact not found/,
    );
  });

  it('keeps another company’s contacts out of the list', async () => {
    await runForOrganization(otherCompany, () =>
      VendorContactModel.create({ supplierId, name: 'Elsewhere', email: 'x@elsewhere.test' }),
    );

    expect(await Query.vendorContacts(null, { supplierId }, products)).toEqual([]);
  });

  it('is Products’ business: Finance and Support are refused', async () => {
    for (const ctx of [finance, staff([ROLES.SUPPORT])]) {
      expect(await codeOf(Query.vendorContacts(null, { supplierId }, ctx))).toBe('FORBIDDEN');
      expect(await codeOf(Mutation.addVendorContact(null, contactInput(), ctx))).toBe('FORBIDDEN');
    }
  });

  it('honours a role restricted to viewing suppliers', async () => {
    await RolePermissionModel.create({
      role: ROLES.PRODUCTS,
      module: 'Supplier',
      actions: ['VIEW'],
    });

    expect(await Query.vendorContacts(null, { supplierId }, products)).toEqual([]);
    expect(await codeOf(Mutation.addVendorContact(null, contactInput(), products))).toBe(
      'FORBIDDEN',
    );
  });
});

describe('vendor invoice review', () => {
  it('lists every supplier’s invoices with payment status, and sums them', async () => {
    await seedInvoice(supplierId, { invoiceNumber: 'INV-1', amount: 100 });
    await seedInvoice(supplierId, { invoiceNumber: 'INV-2', amount: 50, status: 'REJECTED' });

    const page = await Query.listVendorInvoicesPaged(null, PAGE, finance);
    expect(page.totalCount).toBe(2);
    expect(
      page.rows.every((row: { paymentStatus: string }) => row.paymentStatus === 'NOT_BILLED'),
    ).toBe(true);
    const stats = await Query.listVendorInvoicesStats(null, null, products);
    expect(stats).toMatchObject({ total: 2 });
    expect(JSON.stringify(stats)).toContain('150');
  });

  it('approving files an unpaid Finance bill the supplier sees as unpaid, then paid', async () => {
    const id = await seedInvoice(supplierId);

    const approved = await Mutation.approveVendorInvoice(null, { id }, finance);

    expect(approved).toMatchObject({
      id,
      status: 'APPROVED',
      reviewedBy: 'reviewer@exyconn.com',
      paymentStatus: 'UNPAID',
    });
    const bill = await CompanyExpenseModel.findById(approved.expenseId).lean();
    expect(bill).toMatchObject({
      vendor: 'Widgets Ltd',
      category: 'SERVICES',
      description: 'Invoice INV-1 for PO-1',
      amount: 110,
      currency: 'USD',
      incurredOn: new Date('2026-10-05'),
      dueDate: new Date('2026-11-05'),
      reference: 'INV-1',
      recordedBy: 'reviewer@exyconn.com',
      status: 'UNPAID',
    });
    expect((await AuditLogModel.findOne({ module: 'VendorInvoice' }).lean())?.summary).toBe(
      'Approved Widgets Ltd invoice INV-1 and filed it as a bill',
    );

    await CompanyExpenseModel.updateOne(
      { _id: approved.expenseId },
      { status: 'PAID', paidOn: new Date('2026-11-01') },
    );
    const page = await Query.listVendorInvoicesPaged(null, PAGE, finance);
    expect(page.rows[0]).toMatchObject({ paymentStatus: 'PAID' });
  });

  it('files one bill when an invoice is approved twice', async () => {
    const id = await seedInvoice(supplierId);
    await Mutation.approveVendorInvoice(null, { id }, products);

    await expect(Mutation.approveVendorInvoice(null, { id }, products)).rejects.toThrow(
      /Only an invoice waiting for review can be approved/,
    );
    expect(await CompanyExpenseModel.countDocuments()).toBe(1);
  });

  it('hands the claim back when the bill cannot be filed', async () => {
    const id = await seedInvoice(supplierId);
    jest.spyOn(CompanyExpenseModel, 'create').mockRejectedValueOnce(new Error('disk full'));

    await expect(Mutation.approveVendorInvoice(null, { id }, products)).rejects.toThrow(
      'disk full',
    );
    const stored = await VendorInvoiceModel.findById(id).lean();
    expect(stored).toMatchObject({ status: 'SUBMITTED', reviewedBy: '', reviewedAt: null });
  });

  it('answers with the claimed invoice when it vanishes after its bill is filed', async () => {
    const id = await seedInvoice(supplierId);
    jest
      .spyOn(VendorInvoiceModel, 'findByIdAndUpdate')
      .mockReturnValueOnce({ lean: () => Promise.resolve(null) } as never);

    const approved = await Mutation.approveVendorInvoice(null, { id }, products);

    expect(approved).toMatchObject({ id, status: 'APPROVED', paymentStatus: 'NOT_BILLED' });
    expect(await CompanyExpenseModel.countDocuments()).toBe(1);
  });

  it('rejects with the reason the supplier will see', async () => {
    const id = await seedInvoice(supplierId);

    const rejected = await Mutation.rejectVendorInvoice(
      null,
      { id, reason: '  Wrong PO number  ' },
      products,
    );

    expect(rejected).toMatchObject({
      status: 'REJECTED',
      reviewNote: 'Wrong PO number',
      paymentStatus: 'NOT_BILLED',
    });
    expect(await CompanyExpenseModel.countDocuments()).toBe(0);
    expect((await AuditLogModel.findOne({ module: 'VendorInvoice' }).lean())?.summary).toBe(
      'Rejected Widgets Ltd invoice INV-1: Wrong PO number',
    );
  });

  it.each([
    ['a blank reason', '   '],
    ['a reason over 1000 characters', 'r'.repeat(1001)],
  ])('refuses to reject with %s', async (_label, reason) => {
    const id = await seedInvoice(supplierId);

    await expect(Mutation.rejectVendorInvoice(null, { id, reason }, products)).rejects.toThrow(
      /up to 1000 characters/,
    );
  });

  it('only reviews an invoice still waiting', async () => {
    const id = await seedInvoice(supplierId, { status: 'REJECTED' });

    await expect(Mutation.approveVendorInvoice(null, { id }, products)).rejects.toThrow(
      /can be approved/,
    );
    await expect(
      Mutation.rejectVendorInvoice(null, { id, reason: 'again' }, products),
    ).rejects.toThrow(/can be rejected/);
  });

  it('treats an unknown or another company’s invoice as not found', async () => {
    const elsewhere = await runForOrganization(otherCompany, () => seedInvoice(supplierId));

    for (const id of [MISSING, elsewhere]) {
      await expect(Mutation.approveVendorInvoice(null, { id }, products)).rejects.toThrow(
        /Vendor invoice not found/,
      );
      await expect(
        Mutation.rejectVendorInvoice(null, { id, reason: 'no' }, products),
      ).rejects.toThrow(/Vendor invoice not found/);
    }
  });

  it('refuses reviewers outside Products and Finance, and a role without APPROVE', async () => {
    const id = await seedInvoice(supplierId);
    const support = staff([ROLES.SUPPORT]);

    expect(await codeOf(Query.listVendorInvoicesPaged(null, PAGE, support))).toBe('FORBIDDEN');
    expect(await codeOf(Query.listVendorInvoicesStats(null, null, support))).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.approveVendorInvoice(null, { id }, support))).toBe('FORBIDDEN');

    await RolePermissionModel.create({
      role: ROLES.FINANCE,
      module: 'VendorInvoice',
      actions: ['VIEW'],
    });
    expect(await codeOf(Query.listVendorInvoicesPaged(null, PAGE, finance))).toBe('OK');
    expect(await codeOf(Mutation.approveVendorInvoice(null, { id }, finance))).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.rejectVendorInvoice(null, { id, reason: 'no' }, finance))).toBe(
      'FORBIDDEN',
    );
    expect(await CompanyExpenseModel.countDocuments()).toBe(0);
  });
});
