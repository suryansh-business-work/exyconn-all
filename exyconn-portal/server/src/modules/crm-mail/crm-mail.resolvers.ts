import { ROLES } from '../../constants/roles';
import { assertPermission } from '../../lib/permissions';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import { forCrmUser } from '../gmail/gmail.client';
import { assertCompanyCrm } from '../gmail/gmail.crm';
import { auditGmail } from '../gmail/gmail.audit';
import { applyMailAction, type MailAction, type MailThreadRef } from './crm-mail.actions';
import { mailFailure } from './crm-mail.errors';
import type { MailFolder } from './crm-mail.folders';
import { listMailThreads } from './crm-mail.list';
import { folderCounts, mailboxesFor, mailMailboxes, readableMailboxes } from './crm-mail.mailboxes';
import { syncMailboxes } from './crm-mail.sync';
import { mailAttachment, mailThreadDetail } from './crm-mail.thread';

/**
 * Reading the company's mail is a CRM activity, like the Emails tab of a contact: a CRM user
 * with the Activity right, working in their company's CRM (the tenancy scope keeps each
 * company to its own mailboxes and conversations).
 */
const crmMail = async (ctx: GraphQLContext, action: PermissionAction) => {
  await assertPermission(ctx, 'Activity', [ROLES.CRM], action);
  assertCompanyCrm();
};

/** Archiving and trashing take mail out of view, so they are recorded in Admin > Audit. */
const AUDITED: Partial<Record<MailAction, string>> = {
  ARCHIVE: 'Archived',
  TRASH: 'Moved to Gmail trash',
};

interface ThreadsArgs {
  input: {
    accountId?: string | null;
    folder: MailFolder;
    search?: string | null;
    page: number;
    pageSize: number;
  };
}

export const crmMailResolvers = {
  CrmMailThreadSummary: {
    id: (row: { accountId: string; threadId: string }) => `${row.accountId}:${row.threadId}`,
  },
  CrmMailThread: {
    inbox: (row: { labelIds: string[] }) => row.labelIds.includes('INBOX'),
  },
  Query: {
    crmMailOverview: async (
      _p: unknown,
      { accountId }: { accountId?: string | null },
      ctx: GraphQLContext,
    ) => {
      await crmMail(ctx, 'VIEW');
      const mailboxes = await mailMailboxes();
      const readable = mailboxes.filter((mailbox) => mailbox.readable);
      const chosen = readable.filter((mailbox) => !accountId || mailbox.id === accountId);
      return { mailboxes, folders: await folderCounts(chosen.map((mailbox) => mailbox.id)) };
    },
    crmMailThreads: async (_p: unknown, { input }: ThreadsArgs, ctx: GraphQLContext) => {
      await crmMail(ctx, 'VIEW');
      return forCrmUser(async () => listMailThreads(await mailboxesFor(input.accountId), input));
    },
    crmMailThread: async (
      _p: unknown,
      { accountId, threadId }: { accountId: string; threadId: string },
      ctx: GraphQLContext,
    ) => {
      await crmMail(ctx, 'VIEW');
      return forCrmUser(async () => {
        const all = await readableMailboxes();
        const [mailbox] = await mailboxesFor(accountId);
        return mailThreadDetail(mailbox, threadId, new Set(all.map((each) => each.email)));
      });
    },
    crmMailAttachment: async (
      _p: unknown,
      args: { accountId: string; messageId: string; attachmentId: string },
      ctx: GraphQLContext,
    ) => {
      await crmMail(ctx, 'VIEW');
      return forCrmUser(async () => {
        const [mailbox] = await mailboxesFor(args.accountId);
        return mailAttachment(mailbox, args.messageId, args.attachmentId);
      });
    },
  },
  Mutation: {
    syncCrmMail: async (
      _p: unknown,
      { accountId }: { accountId?: string | null },
      ctx: GraphQLContext,
    ) => {
      await crmMail(ctx, 'VIEW');
      return forCrmUser(async () => syncMailboxes(await mailboxesFor(accountId)));
    },
    crmMailThreadAction: async (
      _p: unknown,
      { threads, action }: { threads: MailThreadRef[]; action: MailAction },
      ctx: GraphQLContext,
    ) => {
      await crmMail(ctx, action === 'TRASH' ? 'DELETE' : 'EDIT');
      const outcomes = await forCrmUser(async () =>
        applyMailAction(await readableMailboxes(), threads, action),
      );
      const verb = AUDITED[action];
      for (const outcome of outcomes.filter((each) => verb && each.changed > 0)) {
        const summary = `${verb}: ${outcome.changed} conversation(s) in ${outcome.email}`;
        const kind = action === 'TRASH' ? 'DELETE' : 'UPDATE';
        await auditGmail(ctx, kind, { id: outcome.email, label: outcome.email }, summary);
      }
      const failed = outcomes.find((outcome) => outcome.failure !== null);
      if (failed) {
        mailFailure(failed.failure, failed.email, action);
      }
      return outcomes.reduce((total, outcome) => total + outcome.changed, 0);
    },
  },
};
