import { ROLES } from '../../constants/roles';
import { assertPermission, PERMISSION_MODULES } from '../../lib/permissions';
import { runForOrganization } from '../../lib/tenant';
import { unauthenticated } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';
import type { PermissionAction } from '../permissions/permission.model';
import { recordAudit } from '../audit';
import { requestVendorPortalCode, verifyVendorPortalCode, type VendorContact } from './vendor.auth';
import { vendorContactsService, type VendorContactInput } from './vendor-contacts.service';
import { vendorActor, vendorService, type VendorInvoiceInput } from './vendor.service';
import { vendorReviewService } from './vendor-review.service';

export { vendorPortalTypeDefs, vendorStaffTypeDefs } from './vendor.typeDefs';
export { VENDOR_PASS_HEADER, vendorForPass, type VendorContact } from './vendor.auth';

type Id = { id: string };
type Paged = { input: TableQueryInput };

const REVIEW_MODULE = 'VendorInvoice';
PERMISSION_MODULES.add(REVIEW_MODULE);

/** Supplier access is part of the Supplier record (Products). */
const supplierGuard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'Supplier', [ROLES.PRODUCTS], action);
/** Reviewing a supplier's invoice files a Finance bill, so Products or Finance may do it. */
const reviewGuard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, REVIEW_MODULE, [ROLES.PRODUCTS, ROLES.FINANCE], action);

/**
 * Runs vendor portal work for the signed-in contact, inside the buying company. The request
 * context itself carries no company (see middleware/auth), so nothing else a contact can reach
 * ever sees company data.
 */
function asVendor<T>(ctx: GraphQLContext, work: (contact: VendorContact) => Promise<T>) {
  const contact = ctx.vendorContact;
  if (!contact) {
    unauthenticated('Sign in to the vendor portal.');
  }
  return runForOrganization(contact.organizationId, () => work(contact));
}

export const vendorPortalResolvers = {
  Query: {
    vendorPortalMe: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asVendor(ctx, (contact) => vendorService.me(contact)),
    vendorPurchaseOrders: (_p: unknown, { input }: Paged, ctx: GraphQLContext) =>
      asVendor(ctx, (contact) => vendorService.purchaseOrders(contact, input)),
    vendorInvoices: (_p: unknown, { input }: Paged, ctx: GraphQLContext) =>
      asVendor(ctx, (contact) => vendorService.invoices(contact, input)),
    vendorContacts: async (
      _p: unknown,
      { supplierId }: { supplierId: string },
      ctx: GraphQLContext,
    ) => {
      await supplierGuard(ctx, 'VIEW');
      return withIds(await vendorContactsService.list(supplierId));
    },
    listVendorInvoicesPaged: async (_p: unknown, { input }: Paged, ctx: GraphQLContext) => {
      await reviewGuard(ctx, 'VIEW');
      return vendorReviewService.list(input);
    },
    listVendorInvoicesStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await reviewGuard(ctx, 'VIEW');
      return vendorReviewService.stats();
    },
  },
  Mutation: {
    requestVendorPortalCode: (_p: unknown, { email }: { email: string }, ctx: GraphQLContext) =>
      requestVendorPortalCode(email, ctx.ip ?? 'unknown'),
    verifyVendorPortalCode: (_p: unknown, { email, code }: { email: string; code: string }) =>
      verifyVendorPortalCode(email, code),
    vendorAcknowledgePurchaseOrder: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asVendor(ctx, async (contact) => {
        const order = await vendorService.acknowledge(contact, id);
        await recordAudit(ctx, {
          action: 'UPDATE',
          module: 'PurchaseOrder',
          entityId: id,
          entityLabel: order.number,
          summary: `${contact.name} acknowledged ${order.number} in the vendor portal`,
          actor: vendorActor(contact),
        });
        return order;
      }),
    vendorUploadInvoiceFile: (
      _p: unknown,
      { file, fileName }: { file: string; fileName: string },
      ctx: GraphQLContext,
    ) => asVendor(ctx, () => vendorService.uploadFile(file, fileName)),
    vendorSubmitInvoice: (
      _p: unknown,
      { input }: { input: VendorInvoiceInput },
      ctx: GraphQLContext,
    ) =>
      asVendor(ctx, async (contact) => {
        const invoice = await vendorService.submitInvoice(contact, input);
        await recordAudit(ctx, {
          action: 'CREATE',
          module: REVIEW_MODULE,
          entityId: invoice.id,
          entityLabel: invoice.invoiceNumber,
          summary: `${contact.name} sent invoice ${invoice.invoiceNumber} for ${invoice.purchaseOrderNumber}`,
          actor: vendorActor(contact),
        });
        return invoice;
      }),

    addVendorContact: async (
      _p: unknown,
      { input }: { input: VendorContactInput },
      ctx: GraphQLContext,
    ) => {
      await supplierGuard(ctx, 'EDIT');
      const contact = await vendorContactsService.add(input);
      await recordAudit(ctx, {
        action: 'CREATE',
        module: 'Supplier',
        entityId: contact._id,
        entityLabel: contact.email,
        summary: `Gave ${contact.email} vendor portal access`,
      });
      return withId(contact);
    },
    setVendorContactActive: async (
      _p: unknown,
      { id, active }: Id & { active: boolean },
      ctx: GraphQLContext,
    ) => {
      await supplierGuard(ctx, 'EDIT');
      const contact = await vendorContactsService.setActive(id, active);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: 'Supplier',
        entityId: id,
        entityLabel: contact.email,
        summary: `${active ? 'Restored' : 'Switched off'} vendor portal access for ${contact.email}`,
      });
      return withId(contact);
    },
    deleteVendorContact: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await supplierGuard(ctx, 'EDIT');
      const contact = await vendorContactsService.remove(id);
      await recordAudit(ctx, {
        action: 'DELETE',
        module: 'Supplier',
        entityId: id,
        entityLabel: contact.email,
        summary: `Removed vendor portal access for ${contact.email}`,
      });
      return true;
    },
    approveVendorInvoice: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      const user = await reviewGuard(ctx, 'APPROVE');
      const invoice = await vendorReviewService.approve(id, user.email);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: REVIEW_MODULE,
        entityId: id,
        entityLabel: invoice.invoiceNumber,
        summary: `Approved ${invoice.supplierName} invoice ${invoice.invoiceNumber} and filed it as a bill`,
      });
      return invoice;
    },
    rejectVendorInvoice: async (
      _p: unknown,
      { id, reason }: Id & { reason: string },
      ctx: GraphQLContext,
    ) => {
      const user = await reviewGuard(ctx, 'APPROVE');
      const invoice = await vendorReviewService.reject(id, reason, user.email);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: REVIEW_MODULE,
        entityId: id,
        entityLabel: invoice.invoiceNumber,
        summary: `Rejected ${invoice.supplierName} invoice ${invoice.invoiceNumber}: ${reason.trim()}`,
      });
      return invoice;
    },
  },
};
