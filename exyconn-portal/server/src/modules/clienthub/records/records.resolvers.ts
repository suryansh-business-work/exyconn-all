import { withId, withIds } from '../../../utils/serialize';
import type { GraphQLContext } from '../../../middleware/auth';
import type { TableQueryInput } from '../../../utils/tableQuery';
import { recordAudit } from '../../audit';
import { asContact, clientStaffGuard } from '../clienthub.scope';
import { linksService } from './links.service';
import { communicationsService } from './communications.service';
import { sharesService, type ShareInput } from './shares.service';
import { shareOptions } from './shares.sources';
import { clientEmailService, type EmailClientInput } from './client-email.service';
import { clientSummary } from './client-summary';
import { staffName } from './records.client';
import type { SharedItemKind } from './client-shared-item.model';
import type { ClientCommunicationInput, ClientLinkInput } from './records.validation';

type Id = { id: string };
type ForClient = { clientId: string };
type Paged = { input: TableQueryInput };
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

/** Every staff write lands in the audit log under Clients, named by what it touched. */
const audit = (
  ctx: GraphQLContext,
  action: AuditAction,
  entityId: unknown,
  entityLabel: string,
  summary: string,
) => recordAudit(ctx, { action, module: 'Client', entityId, entityLabel, summary });

const staffQueries = {
  clientSummary: async (_p: unknown, { clientId }: ForClient, ctx: GraphQLContext) => {
    await clientStaffGuard(ctx, 'VIEW');
    return clientSummary(clientId);
  },
  clientLinks: async (_p: unknown, { clientId }: ForClient, ctx: GraphQLContext) => {
    await clientStaffGuard(ctx, 'VIEW');
    return withIds(await linksService.list(clientId));
  },
  listClientCommunicationsPaged: async (_p: unknown, { input }: Paged, ctx: GraphQLContext) => {
    await clientStaffGuard(ctx, 'VIEW');
    return communicationsService.staffPage(input);
  },
  clientSharedItems: async (_p: unknown, { clientId }: ForClient, ctx: GraphQLContext) => {
    await clientStaffGuard(ctx, 'VIEW');
    return sharesService.staffList(clientId);
  },
  clientShareOptions: async (
    _p: unknown,
    { kind }: { kind: SharedItemKind },
    ctx: GraphQLContext,
  ) => {
    await clientStaffGuard(ctx, 'EDIT');
    return shareOptions(kind);
  },
  clientEmailRecipients: async (_p: unknown, { clientId }: ForClient, ctx: GraphQLContext) => {
    await clientStaffGuard(ctx, 'VIEW');
    return (await clientEmailService.recipients(clientId)).recipients;
  },
};

/** Everything here is read for the pass's own client: no argument names a client. */
const hubQueries = {
  clientHubLinks: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
    asContact(ctx, async (contact) => withIds(await linksService.list(contact.clientId))),
  clientHubCommunications: (_p: unknown, { input }: Paged, ctx: GraphQLContext) =>
    asContact(ctx, (contact) => communicationsService.hubPage(contact.clientId, input)),
  clientHubSharedItems: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
    asContact(ctx, (contact) => sharesService.hubList(contact.clientId)),
  clientHubSharedContent: (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
    asContact(ctx, (contact) => sharesService.hubContent(contact.clientId, id)),
};

const linkMutations = {
  createClientLink: async (
    _p: unknown,
    { clientId, input }: ForClient & { input: ClientLinkInput },
    ctx: GraphQLContext,
  ) => {
    await clientStaffGuard(ctx, 'EDIT');
    const link = await linksService.create(clientId, input, await staffName(ctx));
    await audit(ctx, 'CREATE', link._id, link.title, `Added the client link ${link.title}`);
    return withId(link);
  },
  updateClientLink: async (
    _p: unknown,
    { id, input }: Id & { input: ClientLinkInput },
    ctx: GraphQLContext,
  ) => {
    await clientStaffGuard(ctx, 'EDIT');
    const link = await linksService.update(id, input);
    await audit(ctx, 'UPDATE', id, link.title, `Updated the client link ${link.title}`);
    return withId(link);
  },
  deleteClientLink: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
    await clientStaffGuard(ctx, 'EDIT');
    const link = await linksService.remove(id);
    await audit(ctx, 'DELETE', id, link.title, `Removed the client link ${link.title}`);
    return true;
  },
};

const communicationMutations = {
  createClientCommunication: async (
    _p: unknown,
    { clientId, input }: ForClient & { input: ClientCommunicationInput },
    ctx: GraphQLContext,
  ) => {
    await clientStaffGuard(ctx, 'EDIT');
    const entry = await communicationsService.create(clientId, input, await staffName(ctx));
    await audit(ctx, 'CREATE', entry._id, entry.subject, `Logged ${entry.subject}`);
    return withId(entry);
  },
  updateClientCommunication: async (
    _p: unknown,
    { id, input }: Id & { input: ClientCommunicationInput },
    ctx: GraphQLContext,
  ) => {
    await clientStaffGuard(ctx, 'EDIT');
    const entry = await communicationsService.update(id, input);
    await audit(ctx, 'UPDATE', id, entry.subject, `Updated the log entry ${entry.subject}`);
    return withId(entry);
  },
  deleteClientCommunication: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
    await clientStaffGuard(ctx, 'EDIT');
    const entry = await communicationsService.remove(id);
    await audit(ctx, 'DELETE', id, entry.subject, `Removed the log entry ${entry.subject}`);
    return true;
  },
};

const shareMutations = {
  shareWithClient: async (
    _p: unknown,
    { clientId, input }: ForClient & { input: ShareInput },
    ctx: GraphQLContext,
  ) => {
    await clientStaffGuard(ctx, 'EDIT');
    const item = await sharesService.share(clientId, input, await staffName(ctx));
    await audit(ctx, 'CREATE', item.id, item.title, `Shared ${item.title} with a client`);
    return item;
  },
  unshareWithClient: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
    await clientStaffGuard(ctx, 'EDIT');
    const row = await sharesService.unshare(id);
    await audit(ctx, 'DELETE', id, row.kind, `Stopped sharing a ${row.kind.toLowerCase()}`);
    return true;
  },
  emailClient: async (
    _p: unknown,
    { clientId, input }: ForClient & { input: EmailClientInput },
    ctx: GraphQLContext,
  ) => {
    await clientStaffGuard(ctx, 'EDIT');
    const sent = await clientEmailService.send(clientId, input, await staffName(ctx));
    await audit(ctx, 'CREATE', clientId, input.subject, `Emailed the client: ${input.subject}`);
    return sent;
  },
};

/** Admin › Clients › client (staff) and the client hub (contacts) — links, log and shares. */
export const clientRecordsResolvers = {
  Query: { ...staffQueries, ...hubQueries },
  Mutation: { ...linkMutations, ...communicationMutations, ...shareMutations },
};
