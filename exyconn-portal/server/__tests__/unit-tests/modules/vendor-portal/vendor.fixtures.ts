import { vendorPortalResolvers } from '../../../../src/modules/vendor-portal';
import { SupplierModel } from '../../../../src/modules/products/supplier.model';
import { PurchaseOrderModel } from '../../../../src/modules/products/purchase-order.model';
import { VendorInvoiceModel } from '../../../../src/modules/vendor-portal/vendor-invoice.model';
import { WebhookModel } from '../../../../src/modules/integrations/webhook.model';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { VendorContact } from '../../../../src/modules/vendor-portal';

/** Shared fixtures for the vendor portal suites — not a suite itself. */
type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
export const RESOLVERS = {
  ...vendorPortalResolvers.Query,
  ...vendorPortalResolvers.Mutation,
} as unknown as Record<string, Resolver>;

export const PAGE = { input: { page: 0, pageSize: 50 } };
export const MISSING = '64b000000000000000000099';

export async function seedSupplier(name: string, code: string) {
  const supplier = await SupplierModel.create({ name, code });
  return supplier._id.toHexString();
}

export async function seedOrder(
  supplierId: string,
  number: string,
  over: Record<string, unknown> = {},
) {
  const order = await PurchaseOrderModel.create({
    number,
    supplierId,
    supplierName: 'Widgets Ltd',
    status: 'ORDERED',
    orderDate: new Date('2026-10-01'),
    currency: 'USD',
    lines: [{ productId: 'p1', productName: 'Widget', quantity: 2, unitCost: 50, taxPercent: 10 }],
    ...over,
  });
  return order._id.toHexString();
}

export async function seedInvoice(supplierId: string, over: Record<string, unknown> = {}) {
  const invoice = await VendorInvoiceModel.create({
    supplierId,
    supplierName: 'Widgets Ltd',
    purchaseOrderId: 'po-1',
    purchaseOrderNumber: 'PO-1',
    invoiceNumber: 'INV-1',
    invoiceDate: new Date('2026-10-05'),
    dueDate: new Date('2026-11-05'),
    amount: 110,
    currency: 'USD',
    fileUrl: 'https://cdn.test/inv-1.pdf',
    fileName: 'inv-1.pdf',
    ...over,
  });
  return invoice._id.toHexString();
}

export const contactFor = (
  supplierId: string,
  organizationId: string,
  over: Partial<VendorContact> = {},
): VendorContact => ({
  id: 'contact-1',
  supplierId,
  name: 'Sam Patel',
  email: 'sam@widgets.test',
  organizationId,
  ...over,
});

export const asVendor = (contact: VendorContact): GraphQLContext => ({
  user: null,
  vendorContact: contact,
});

export const invoiceInput = (purchaseOrderId: string, over: Record<string, unknown> = {}) => ({
  purchaseOrderId,
  invoiceNumber: ' INV-100 ',
  invoiceDate: new Date('2026-10-10'),
  dueDate: new Date('2026-11-10'),
  amount: 110,
  notes: ' Net 30 ',
  fileUrl: 'https://cdn.test/inv-100.pdf',
  fileName: ' inv-100.pdf ',
  ...over,
});

/** A webhook endpoint listening for `event`, so the emit can be observed as a queued delivery. */
export function listenFor(event: string) {
  return WebhookModel.create({
    name: 'ERP',
    url: 'https://erp.test/hook',
    events: [event],
    secret: 'whsec_test',
  });
}

/** Waits for work that runs just behind the caller, such as a best-effort webhook emit. */
export async function eventually(check: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await check()) {
      return true;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }
  return false;
}
