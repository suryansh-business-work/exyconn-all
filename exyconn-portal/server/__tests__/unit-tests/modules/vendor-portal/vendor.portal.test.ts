import { Types } from 'mongoose';
import { vendorPortalResolvers } from '../../../../src/modules/vendor-portal';
import { PurchaseOrderModel } from '../../../../src/modules/products/purchase-order.model';
import { VendorInvoiceModel } from '../../../../src/modules/vendor-portal/vendor-invoice.model';
import { CompanyExpenseModel } from '../../../../src/modules/finance/company-expense.model';
import { WebhookDeliveryModel } from '../../../../src/modules/integrations/webhook.model';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { imageUploader } from '../../../../src/utils/imagekit';
import { runForOrganization } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { VendorContact } from '../../../../src/modules/vendor-portal';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import {
  MISSING,
  PAGE,
  RESOLVERS,
  asVendor,
  contactFor,
  eventually,
  invoiceInput,
  listenFor,
  seedInvoice,
  seedOrder,
  seedSupplier,
} from './vendor.fixtures';

const organizationId = useTestOrganization();
const otherCompany = new Types.ObjectId().toHexString();
const { Query, Mutation } = vendorPortalResolvers;

let supplierId: string;
let contact: VendorContact;
let ctx: GraphQLContext;

beforeEach(async () => {
  supplierId = await seedSupplier('Widgets Ltd', 'WID');
  contact = contactFor(supplierId, organizationId);
  ctx = asVendor(contact);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const VENDOR_OPERATIONS = [
  'vendorPortalMe',
  'vendorPurchaseOrders',
  'vendorInvoices',
  'vendorAcknowledgePurchaseOrder',
  'vendorUploadInvoiceFile',
  'vendorSubmitInvoice',
];

describe('vendor portal operations', () => {
  it.each(VENDOR_OPERATIONS)('%s refuses a caller without a vendor pass', async (name) => {
    const staff: GraphQLContext = {
      user: { id: 'u1', email: 'admin@exyconn.com', roles: [ROLES.ADMIN], organizationId },
    };
    // The refusal is thrown before any promise exists, so it is caught inside one.
    const call = Promise.resolve().then(() =>
      RESOLVERS[name](null, { ...PAGE, id: MISSING, input: PAGE.input }, staff),
    );

    expect(await codeOf(call)).toBe('UNAUTHENTICATED');
  });
});

describe('vendorPortalMe', () => {
  it('names the contact and their supplier', async () => {
    expect(await Query.vendorPortalMe(null, null, ctx)).toEqual({
      name: 'Sam Patel',
      email: 'sam@widgets.test',
      supplierName: 'Widgets Ltd',
      supplierCode: 'WID',
    });
  });

  it('answers with blanks once the supplier is gone', async () => {
    const gone = asVendor(contactFor(MISSING, organizationId));

    expect(await Query.vendorPortalMe(null, null, gone)).toMatchObject({
      supplierName: '',
      supplierCode: '',
    });
  });
});

describe('vendorPurchaseOrders', () => {
  it('lists only the supplier’s own sent orders — never drafts, another supplier’s or another company’s', async () => {
    const otherSupplier = await seedSupplier('Gadgets Inc', 'GAD');
    await seedOrder(supplierId, 'PO-1');
    await seedOrder(supplierId, 'PO-2', { status: 'CANCELLED' });
    await seedOrder(supplierId, 'PO-DRAFT', { status: 'DRAFT' });
    await seedOrder(otherSupplier, 'PO-OTHER');
    // Another company that happens to hold an order under the same supplier id.
    await runForOrganization(otherCompany, () => seedOrder(supplierId, 'PO-B'));

    const page = await Query.vendorPurchaseOrders(null, PAGE, ctx);

    expect(page.totalCount).toBe(2);
    const numbers = (page.rows as unknown as Array<{ number: string }>).map((row) => row.number);
    expect([...numbers].sort((a, b) => a.localeCompare(b))).toEqual(['PO-1', 'PO-2']);
    expect(page.rows[0]).toHaveProperty('id');
  });
});

describe('vendorAcknowledgePurchaseOrder', () => {
  it('records who confirmed an open order, audits it and emits the webhook', async () => {
    await listenFor('purchase_order.acknowledged');
    const id = await seedOrder(supplierId, 'PO-1');

    const order = await Mutation.vendorAcknowledgePurchaseOrder(null, { id }, ctx);

    expect(order).toMatchObject({ id, acknowledgedBy: 'Sam Patel <sam@widgets.test>' });
    expect(order.acknowledgedAt).toBeInstanceOf(Date);
    const audit = await AuditLogModel.findOne({ module: 'PurchaseOrder' }).lean();
    expect(audit).toMatchObject({
      action: 'UPDATE',
      entityId: id,
      actorId: 'vendor:contact-1',
      summary: 'Sam Patel acknowledged PO-1 in the vendor portal',
    });
    const queued = await eventually(async () =>
      Boolean(await WebhookDeliveryModel.exists({ event: 'purchase_order.acknowledged' })),
    );
    expect(queued).toBe(true);
    const delivery = await WebhookDeliveryModel.findOne().lean();
    expect(JSON.parse(String(delivery?.payload)).data).toMatchObject({
      purchaseOrderId: id,
      number: 'PO-1',
      supplierId,
      acknowledgedBy: 'Sam Patel <sam@widgets.test>',
    });
  });

  it('refuses to acknowledge the same order twice', async () => {
    const id = await seedOrder(supplierId, 'PO-1');
    await Mutation.vendorAcknowledgePurchaseOrder(null, { id }, ctx);

    await expect(Mutation.vendorAcknowledgePurchaseOrder(null, { id }, ctx)).rejects.toThrow(
      /already been acknowledged/,
    );
  });

  it('files one acknowledgement when a second one lands between the read and the write', async () => {
    const id = await seedOrder(supplierId, 'PO-1');
    jest
      .spyOn(PurchaseOrderModel, 'findOneAndUpdate')
      .mockReturnValueOnce({ lean: () => Promise.resolve(null) } as never);

    await expect(Mutation.vendorAcknowledgePurchaseOrder(null, { id }, ctx)).rejects.toThrow(
      /already been acknowledged/,
    );
  });

  it('refuses an order that is no longer open', async () => {
    const id = await seedOrder(supplierId, 'PO-1', { status: 'RECEIVED' });

    await expect(Mutation.vendorAcknowledgePurchaseOrder(null, { id }, ctx)).rejects.toThrow(
      /Only an open order/,
    );
  });

  it('treats a draft, another supplier’s and another company’s order as not found', async () => {
    const otherSupplier = await seedSupplier('Gadgets Inc', 'GAD');
    const draft = await seedOrder(supplierId, 'PO-DRAFT', { status: 'DRAFT' });
    const theirs = await seedOrder(otherSupplier, 'PO-OTHER');
    const elsewhere = await runForOrganization(otherCompany, () => seedOrder(supplierId, 'PO-B'));

    for (const id of [draft, theirs, elsewhere]) {
      await expect(Mutation.vendorAcknowledgePurchaseOrder(null, { id }, ctx)).rejects.toThrow(
        /Purchase order not found/,
      );
    }
    const untouched = await runForOrganization(otherCompany, () =>
      PurchaseOrderModel.findById(elsewhere).lean(),
    );
    expect(untouched?.acknowledgedAt).toBeNull();
  });
});

describe('vendorUploadInvoiceFile', () => {
  it('uploads the document to the vendor invoices folder', async () => {
    const upload = jest
      .spyOn(imageUploader, 'uploadImage')
      .mockResolvedValue('https://cdn.test/inv.pdf');

    expect(
      await Mutation.vendorUploadInvoiceFile(null, { file: 'data:x', fileName: 'inv.pdf' }, ctx),
    ).toBe('https://cdn.test/inv.pdf');
    expect(upload).toHaveBeenCalledWith('data:x', 'inv.pdf', 'vendor-invoices');
  });

  it('refuses a file over 12 MB without uploading it', async () => {
    const upload = jest.spyOn(imageUploader, 'uploadImage');
    const file = 'a'.repeat(12 * 1024 * 1024 + 1);

    await expect(
      Mutation.vendorUploadInvoiceFile(null, { file, fileName: 'big.pdf' }, ctx),
    ).rejects.toThrow(/too large/);
    expect(upload).not.toHaveBeenCalled();
  });
});

describe('vendorSubmitInvoice', () => {
  it('files the invoice against the supplier’s order for review, audited and announced', async () => {
    await listenFor('vendor_invoice.submitted');
    const orderId = await seedOrder(supplierId, 'PO-1');

    const invoice = await Mutation.vendorSubmitInvoice(null, { input: invoiceInput(orderId) }, ctx);

    expect(invoice).toMatchObject({
      supplierId,
      supplierName: 'Widgets Ltd',
      purchaseOrderId: orderId,
      purchaseOrderNumber: 'PO-1',
      invoiceNumber: 'INV-100',
      amount: 110,
      currency: 'USD',
      notes: 'Net 30',
      fileName: 'inv-100.pdf',
      status: 'SUBMITTED',
      submittedBy: 'Sam Patel <sam@widgets.test>',
      paymentStatus: 'NOT_BILLED',
      paidOn: null,
    });
    const audit = await AuditLogModel.findOne({ module: 'VendorInvoice' }).lean();
    expect(audit?.summary).toBe('Sam Patel sent invoice INV-100 for PO-1');
    expect(audit?.actorEmail).toBe('sam@widgets.test');
    const queued = await eventually(async () =>
      Boolean(await WebhookDeliveryModel.exists({ event: 'vendor_invoice.submitted' })),
    );
    expect(queued).toBe(true);
    const delivery = await WebhookDeliveryModel.findOne().lean();
    // Two widgets at 50 with 10% tax.
    expect(JSON.parse(String(delivery?.payload)).data).toMatchObject({
      invoiceNumber: 'INV-100',
      orderTotal: 110,
    });
  });

  it('keeps notes empty when none are sent', async () => {
    const orderId = await seedOrder(supplierId, 'PO-1');

    const invoice = await Mutation.vendorSubmitInvoice(
      null,
      { input: invoiceInput(orderId, { notes: null }) },
      ctx,
    );

    expect(invoice.notes).toBe('');
  });

  it.each([
    ['a blank invoice number', { invoiceNumber: '  ' }, /Enter the invoice number/],
    ['an invoice number over 60 characters', { invoiceNumber: 'N'.repeat(61) }, /invoice number/],
    ['a zero amount', { amount: 0 }, /more than zero/],
    ['a negative amount', { amount: -5 }, /more than zero/],
    ['a due date before the invoice date', { dueDate: new Date('2026-10-01') }, /cannot be before/],
    ['notes over 2000 characters', { notes: 'x'.repeat(2001) }, /under 2000/],
    ['a document that is not on https', { fileUrl: 'http://cdn.test/a.pdf' }, /Attach the invoice/],
  ])('refuses %s', async (_label, over, message) => {
    const orderId = await seedOrder(supplierId, 'PO-1');

    await expect(
      Mutation.vendorSubmitInvoice(null, { input: invoiceInput(orderId, over) }, ctx),
    ).rejects.toThrow(message);
    expect(await VendorInvoiceModel.countDocuments()).toBe(0);
  });

  it('refuses to invoice another supplier’s or another company’s order', async () => {
    const otherSupplier = await seedSupplier('Gadgets Inc', 'GAD');
    const theirs = await seedOrder(otherSupplier, 'PO-OTHER');
    const elsewhere = await runForOrganization(otherCompany, () => seedOrder(supplierId, 'PO-B'));

    for (const id of [theirs, elsewhere]) {
      await expect(
        Mutation.vendorSubmitInvoice(null, { input: invoiceInput(id) }, ctx),
      ).rejects.toThrow(/Purchase order not found/);
    }
    expect(await VendorInvoiceModel.countDocuments()).toBe(0);
  });

  it('refuses to invoice a cancelled order', async () => {
    const orderId = await seedOrder(supplierId, 'PO-1', { status: 'CANCELLED' });

    await expect(
      Mutation.vendorSubmitInvoice(null, { input: invoiceInput(orderId) }, ctx),
    ).rejects.toThrow(/cancelled order cannot be invoiced/);
  });

  it('refuses the same invoice number twice, unless the first was rejected', async () => {
    const orderId = await seedOrder(supplierId, 'PO-1');
    const first = await Mutation.vendorSubmitInvoice(null, { input: invoiceInput(orderId) }, ctx);

    await expect(
      Mutation.vendorSubmitInvoice(null, { input: invoiceInput(orderId) }, ctx),
    ).rejects.toThrow(/INV-100 has already been sent/);

    await VendorInvoiceModel.updateOne({ _id: first.id }, { status: 'REJECTED' });
    const resent = await Mutation.vendorSubmitInvoice(null, { input: invoiceInput(orderId) }, ctx);
    expect(resent.id).not.toBe(first.id);
  });
});

describe('vendorInvoices', () => {
  it('lists the supplier’s own invoices with the payment status of the bill each one filed', async () => {
    const otherSupplier = await seedSupplier('Gadgets Inc', 'GAD');
    const paidOn = new Date('2026-10-20');
    const bill = await CompanyExpenseModel.create({
      vendor: 'Widgets Ltd',
      category: 'SERVICES',
      amount: 110,
      currency: 'USD',
      incurredOn: new Date('2026-10-05'),
      dueDate: new Date('2026-11-05'),
      status: 'PAID',
      paidOn,
    });
    await seedInvoice(supplierId, { invoiceNumber: 'INV-1' });
    await seedInvoice(supplierId, {
      invoiceNumber: 'INV-2',
      status: 'APPROVED',
      expenseId: String(bill._id),
    });
    await seedInvoice(otherSupplier, { invoiceNumber: 'INV-THEIRS' });
    await runForOrganization(otherCompany, () =>
      seedInvoice(supplierId, { invoiceNumber: 'INV-ELSEWHERE' }),
    );

    const page = await Query.vendorInvoices(null, PAGE, ctx);

    expect(page.totalCount).toBe(2);
    const byNumber = Object.fromEntries(
      (page.rows as unknown as Array<{ invoiceNumber: string }>).map((row) => [
        row.invoiceNumber,
        row,
      ]),
    );
    expect(byNumber['INV-1']).toMatchObject({ paymentStatus: 'NOT_BILLED', paidOn: null });
    expect(byNumber['INV-2']).toMatchObject({ paymentStatus: 'PAID', paidOn });
  });

  it('reads a bill deleted in Finance as not billed', async () => {
    await seedInvoice(supplierId, { status: 'APPROVED', expenseId: MISSING });

    const page = await Query.vendorInvoices(null, PAGE, ctx);

    expect(page.rows[0]).toMatchObject({ paymentStatus: 'NOT_BILLED', paidOn: null });
  });
});
