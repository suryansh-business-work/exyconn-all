import { actorNameOf } from '../../lib/actor';
import { callerOrganization } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { forbidden } from '../../utils/errors';
import { recordAudit, type AuditAction } from '../audit';
import { startGmailConnect } from '../gmail/gmail.connect';
import { forCrmUser } from '../gmail/gmail.client';
import { startMicrosoftConnect } from '../microsoft-mail/microsoft.connect';
import { MY_MAILBOX_AUDIT_MODULE, type MailboxProvider } from './my-mailboxes.default';
import {
  disconnectMyMailbox,
  listMyMailboxes,
  myMailboxProviders,
  setDefaultMyMailbox,
  testMyMailbox,
} from './my-mailboxes.service';
import { sendMyEmail, type SendMyEmailInput } from './my-mailboxes.send';

/**
 * A person's own mailboxes need no CRM role: anybody signed in to a company may connect,
 * use and remove their own. Every call works on the caller's rows alone (my-mailboxes.service).
 */
function signedInPerson(ctx: GraphQLContext) {
  const user = assertAuthenticated(ctx);
  const organizationId = callerOrganization(ctx, user);
  if (organizationId === null) {
    forbidden('Open your company’s portal to use your own mailbox.');
  }
  return { user, organizationId };
}

/** One audit line for the caller's mailbox, never with a token or an email body. */
const audit = (
  ctx: GraphQLContext,
  action: AuditAction,
  entity: Readonly<{ id: string; label: string }>,
  summary: string,
) =>
  recordAudit(ctx, {
    action,
    module: MY_MAILBOX_AUDIT_MODULE,
    entityId: entity.id,
    entityLabel: entity.label,
    summary,
  });

type IdArgs = { id: string };

export const myMailboxesResolvers = {
  Query: {
    myMailboxes: async (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      listMyMailboxes(signedInPerson(ctx).user.id),
    myMailboxProviders: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      signedInPerson(ctx);
      return myMailboxProviders();
    },
  },
  Mutation: {
    startMyMailboxConnect: async (
      _p: unknown,
      args: { provider: MailboxProvider; returnTo: string; loginHint?: string | null },
      ctx: GraphQLContext,
    ) => {
      const { user, organizationId } = signedInPerson(ctx);
      const actor = {
        id: user.id,
        name: await actorNameOf(ctx),
        organizationId,
        ownerUserId: user.id,
      };
      const start = args.provider === 'GMAIL' ? startGmailConnect : startMicrosoftConnect;
      return forCrmUser(() => start(args.returnTo, actor, args.loginHint));
    },
    testMyMailbox: async (_p: unknown, { id }: IdArgs, ctx: GraphQLContext) => {
      const { user } = signedInPerson(ctx);
      const tested = await forCrmUser(() => testMyMailbox(user.id, id));
      const outcome = tested.lastError ? 'failed' : 'worked';
      await audit(
        ctx,
        'UPDATE',
        { id, label: tested.email },
        `Tested their mailbox: it ${outcome}`,
      );
      return tested;
    },
    disconnectMyMailbox: async (_p: unknown, { id }: IdArgs, ctx: GraphQLContext) => {
      const { user } = signedInPerson(ctx);
      const email = await disconnectMyMailbox(user.id, id);
      await audit(ctx, 'DELETE', { id, label: email }, `Disconnected their mailbox ${email}`);
      return true;
    },
    setDefaultMyMailbox: async (_p: unknown, { id }: IdArgs, ctx: GraphQLContext) => {
      const { user } = signedInPerson(ctx);
      const chosen = await setDefaultMyMailbox(user.id, id);
      const summary = `Made ${chosen.email} their default mailbox`;
      await audit(ctx, 'UPDATE', { id, label: chosen.email }, summary);
      return chosen;
    },
    sendMyEmail: async (
      _p: unknown,
      { input }: { input: SendMyEmailInput },
      ctx: GraphQLContext,
    ) => {
      const { user } = signedInPerson(ctx);
      const sent = await forCrmUser(() => sendMyEmail(user.id, input));
      const plural = sent.recipientCount === 1 ? '' : 's';
      const summary = `Sent "${sent.subject}" from ${sent.from} to ${sent.recipientCount} recipient${plural}`;
      await audit(ctx, 'CREATE', { id: sent.from, label: sent.subject }, summary);
      return sent;
    },
  },
};
