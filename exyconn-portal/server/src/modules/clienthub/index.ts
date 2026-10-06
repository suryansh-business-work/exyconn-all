import { ROLES } from '../../constants/roles';
import { runForOrganization } from '../../lib/tenant';
import { assertPermission } from '../../lib/permissions';
import { unauthenticated } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';
import type { PermissionAction } from '../permissions/permission.model';
import { recordAudit } from '../audit';
import { requestClientHubCode, verifyClientHubCode, type ClientHubContact } from './clienthub.auth';
import { clientHubService } from './clienthub.service';
import { contactsService, type ClientContactInput } from './contacts.service';
import { ownAttempt, paymentOptions, startPayment } from './payments/checkout.service';
import {
  gatewayService,
  type RazorpayConfigInput,
  type StripeConfigInput,
} from './payments/gateway.service';
import type { PaymentGateway } from './payments/attempt.model';
import { auditGateway, hasValue, hintOf, techGuard } from './payments/gateway.access';

export { clientHubTypeDefs } from './clienthub.typeDefs';
export { walletGatewayTypeDefs } from './payments/wallets.typeDefs';
export { walletGatewayResolvers } from './payments/wallets.resolvers';
export { CLIENT_PASS_HEADER, contactForPass, type ClientHubContact } from './clienthub.auth';

type Id = { id: string };
type Paged = { input: TableQueryInput };

/**
 * Runs client hub work for the signed-in contact, inside their client's company. The request
 * context itself carries no company (see middleware/auth), so nothing else a contact can reach
 * ever sees company data.
 */
function asContact<T>(ctx: GraphQLContext, work: (contact: ClientHubContact) => Promise<T>) {
  const contact = ctx.clientContact;
  if (!contact) {
    unauthenticated('Sign in to the client hub.');
  }
  return runForOrganization(contact.organizationId, () => work(contact));
}

/** Giving and taking client hub access is an administrator's call, on the Clients module. */
const contactsGuard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'Client', [ROLES.ADMIN], action);

export const clientHubResolvers = {
  Query: {
    clientContacts: async (
      _p: unknown,
      { clientId }: { clientId: string },
      ctx: GraphQLContext,
    ) => {
      await contactsGuard(ctx, 'VIEW');
      return withIds(await contactsService.list(clientId));
    },
    clientHubMe: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => clientHubService.me(contact)),
    clientHubInvoices: (_p: unknown, { input }: Paged, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => clientHubService.invoices(contact, input)),
    clientHubInvoicePdf: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => clientHubService.invoicePdf(contact, id)),
    clientHubPayments: (_p: unknown, { input }: Paged, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => clientHubService.payments(contact, input)),
    clientHubReminders: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => clientHubService.reminders(contact)),
    clientHubTickets: (_p: unknown, { input }: Paged, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => clientHubService.tickets(contact, input)),
    clientHubTicketReplies: (
      _p: unknown,
      { ticketId }: { ticketId: string },
      ctx: GraphQLContext,
    ) => asContact(ctx, (contact) => clientHubService.ticketReplies(contact, ticketId)),
    clientHubProjects: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => clientHubService.projects(contact)),
    clientHubPaymentOptions: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => paymentOptions(contact)),
    clientHubPaymentAttempt: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => ownAttempt(contact, id)),
    listStripeConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techGuard(ctx, 'VIEW');
      return withIds(await gatewayService.listStripe());
    },
    listRazorpayConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techGuard(ctx, 'VIEW');
      return withIds(await gatewayService.listRazorpay());
    },
  },
  Mutation: {
    addClientContact: async (
      _p: unknown,
      { input }: { input: ClientContactInput },
      ctx: GraphQLContext,
    ) => {
      await contactsGuard(ctx, 'EDIT');
      const contact = await contactsService.add(input);
      await recordAudit(ctx, {
        action: 'CREATE',
        module: 'Client',
        entityId: contact._id,
        entityLabel: contact.email,
        summary: `Gave ${contact.email} client hub access`,
      });
      return withId(contact);
    },
    setClientContactActive: async (
      _p: unknown,
      { id, active }: { id: string; active: boolean },
      ctx: GraphQLContext,
    ) => {
      await contactsGuard(ctx, 'EDIT');
      const contact = await contactsService.setActive(id, active);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: 'Client',
        entityId: id,
        entityLabel: contact.email,
        summary: `${active ? 'Restored' : 'Switched off'} client hub access for ${contact.email}`,
      });
      return withId(contact);
    },
    deleteClientContact: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await contactsGuard(ctx, 'DELETE');
      return contactsService.remove(id);
    },
    requestClientHubCode: (_p: unknown, { email }: { email: string }, ctx: GraphQLContext) =>
      requestClientHubCode(email, ctx.ip ?? 'unknown'),
    verifyClientHubCode: (_p: unknown, { email, code }: { email: string; code: string }) =>
      verifyClientHubCode(email, code),
    clientHubEmailInvoice: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      asContact(ctx, (contact) => clientHubService.emailInvoice(contact, id, ctx.ip ?? '')),
    clientHubPayInvoice: (
      _p: unknown,
      { id, gateway }: { id: string; gateway: PaymentGateway },
      ctx: GraphQLContext,
    ) => asContact(ctx, (contact) => startPayment(contact, id, gateway)),
    clientHubOpenTicket: (
      _p: unknown,
      { input }: { input: Parameters<typeof clientHubService.openTicket>[1] },
      ctx: GraphQLContext,
    ) => asContact(ctx, (contact) => clientHubService.openTicket(contact, input)),
    clientHubReplyToTicket: (
      _p: unknown,
      { ticketId, body }: { ticketId: string; body: string },
      ctx: GraphQLContext,
    ) => asContact(ctx, (contact) => clientHubService.replyToTicket(contact, ticketId, body)),

    createStripeConfig: async (
      _p: unknown,
      { input }: { input: StripeConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx, 'CREATE');
      const doc = await gatewayService.createStripe(input);
      await auditGateway(ctx, `Added Stripe account ${input.label}`, doc._id);
      return withId(doc);
    },
    updateStripeConfig: async (
      _p: unknown,
      { id, input }: Id & { input: StripeConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx, 'EDIT');
      const doc = await gatewayService.updateStripe(id, input);
      await auditGateway(ctx, `Updated Stripe account ${input.label}`, id);
      return withId(doc);
    },
    deleteStripeConfig: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techGuard(ctx, 'DELETE');
      await auditGateway(ctx, 'Deleted a Stripe account', id);
      return gatewayService.deleteStripe(id);
    },
    testStripeConnection: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techGuard(ctx, 'VIEW');
      return gatewayService.testStripe(id);
    },
    createRazorpayConfig: async (
      _p: unknown,
      { input }: { input: RazorpayConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx, 'CREATE');
      const doc = await gatewayService.createRazorpay(input);
      await auditGateway(ctx, `Added Razorpay account ${input.label}`, doc._id);
      return withId(doc);
    },
    updateRazorpayConfig: async (
      _p: unknown,
      { id, input }: Id & { input: RazorpayConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx, 'EDIT');
      const doc = await gatewayService.updateRazorpay(id, input);
      await auditGateway(ctx, `Updated Razorpay account ${input.label}`, id);
      return withId(doc);
    },
    deleteRazorpayConfig: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techGuard(ctx, 'DELETE');
      await auditGateway(ctx, 'Deleted a Razorpay account', id);
      return gatewayService.deleteRazorpay(id);
    },
    testRazorpayConnection: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techGuard(ctx, 'VIEW');
      return gatewayService.testRazorpay(id);
    },
  },
  StripeConfig: {
    hasSecretKey: hasValue('secretKey'),
    secretKeyHint: hintOf('secretKeyHint'),
    hasWebhookSecret: hasValue('webhookSecret'),
    webhookSecretHint: hintOf('webhookSecretHint'),
  },
  RazorpayConfig: {
    hasKeySecret: hasValue('keySecret'),
    keySecretHint: hintOf('keySecretHint'),
    hasWebhookSecret: hasValue('webhookSecret'),
    webhookSecretHint: hintOf('webhookSecretHint'),
  },
};
