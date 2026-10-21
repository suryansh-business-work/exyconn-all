import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPermission } from '../../lib/permissions';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import { recordAudit } from '../audit';
import { draftCrmEmail, summariseCrmRecord, type DraftCrmEmailInput } from '../crm/crm.ai';
import {
  presentGmailConfig,
  readGmailConfig,
  saveGmailConfig,
  startGmailConnect,
  useGoogleSignInClientForGmail,
  testGmail,
  type GmailConfigInput,
} from './gmail.connect';
import {
  disconnectGmailAccount,
  enabledMailboxes,
  listGmailAccounts,
  presentGmailAccount,
  setGmailAccountEnabled,
} from './gmail.accounts';
import { assertCompanyCrm, type SendCrmEmailInput } from './gmail.crm';
import { crmEmailThreads } from './gmail.sync';
import { auditGmail } from './gmail.audit';
import { forCrmUser, gmailClientConfig } from './gmail.client';
import { auditMicrosoft } from '../microsoft-mail';
import { defaultEmailSender, sendFromAnyMailbox } from '../crm-integrations/crm-integrations.email';

const TECH_MODULE = 'TechConfig';
const techStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, TECH_MODULE, [ROLES.TECH], action);
/** Emailing a contact is a CRM activity; reading their mail needs to see the contact. */
const crmUser = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'Activity', [ROLES.CRM], action);
/** Every Gmail account call: a CRM user with the right, working in their company's CRM. */
const crmGmail = async (ctx: GraphQLContext, action: PermissionAction) => {
  const user = await crmUser(ctx, action);
  return { user, organizationId: assertCompanyCrm() };
};

type Kind = 'CONTACT' | 'COMPANY';

export const gmailResolvers = {
  CrmEmailMessage: {
    id: (row: { id?: string; gmailId: string }) => row.id ?? row.gmailId,
    sentByName: (row: { sentByName?: string | null }) => row.sentByName ?? '',
    accountId: (row: { accountId?: string | null }) => row.accountId ?? '',
    mailbox: (row: { mailbox?: string | null }) => row.mailbox ?? '',
  },
  Query: {
    gmailConfig: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'VIEW');
      return presentGmailConfig(await readGmailConfig());
    },
    gmailAccounts: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crmGmail(ctx, 'VIEW');
      return (await listGmailAccounts()).map(presentGmailAccount);
    },
    gmailClientReady: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crmGmail(ctx, 'VIEW');
      return gmailClientConfig().then(
        () => true,
        () => false,
      );
    },
    crmEmailThreads: async (
      _p: unknown,
      { object, id }: { object: Kind; id: string },
      ctx: GraphQLContext,
    ) => {
      await crmGmail(ctx, 'VIEW');
      return forCrmUser(() => crmEmailThreads(object, id));
    },
    crmEmailSender: async (
      _p: unknown,
      { object, id }: { object: Kind; id: string },
      ctx: GraphQLContext,
    ) => {
      await crmGmail(ctx, 'VIEW');
      return defaultEmailSender(object, id);
    },
    crmGmailReady: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crmUser(ctx, 'VIEW');
      try {
        assertCompanyCrm();
        return (await enabledMailboxes()).length > 0;
      } catch {
        return false;
      }
    },
  },
  Mutation: {
    saveGmailConfig: async (
      _p: unknown,
      { input }: { input: GmailConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      const saved = await saveGmailConfig(input, await actorNameOf(ctx));
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: TECH_MODULE,
        entityId: 'gmail',
        entityLabel: 'Gmail',
        summary: `Saved the Gmail client (${input.enabled ? 'on' : 'off'})`,
      });
      return presentGmailConfig(saved);
    },
    useGoogleSignInClientForGmail: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      const saved = await useGoogleSignInClientForGmail(await actorNameOf(ctx));
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: TECH_MODULE,
        entityId: 'gmail',
        entityLabel: 'Gmail',
        summary: 'Pointed Gmail at the Google sign-in client and turned it on',
      });
      return presentGmailConfig(saved);
    },
    startGmailConnect: async (
      _p: unknown,
      { returnTo }: { returnTo: string },
      ctx: GraphQLContext,
    ) => {
      const { user, organizationId } = await crmGmail(ctx, 'EDIT');
      return startGmailConnect(returnTo, {
        id: user.id,
        name: await actorNameOf(ctx),
        organizationId,
      });
    },
    setGmailAccountEnabled: async (
      _p: unknown,
      { id, enabled }: { id: string; enabled: boolean },
      ctx: GraphQLContext,
    ) => {
      await crmGmail(ctx, 'EDIT');
      const saved = await setGmailAccountEnabled(id, enabled);
      const summary = `${enabled ? 'Turned on' : 'Turned off'} the Gmail account ${saved.email} for the CRM`;
      await auditGmail(ctx, 'UPDATE', { id, label: saved.email }, summary);
      return presentGmailAccount(saved);
    },
    disconnectGmailAccount: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await crmGmail(ctx, 'EDIT');
      const removed = await disconnectGmailAccount(id);
      const summary = `Disconnected the Gmail account ${removed.email}`;
      await auditGmail(ctx, 'DELETE', { id, label: removed.email }, summary);
      return true;
    },
    testGmailConfig: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      return testGmail();
    },
    sendCrmEmail: async (
      _p: unknown,
      { input }: { input: SendCrmEmailInput },
      ctx: GraphQLContext,
    ) => {
      await crmUser(ctx, 'CREATE');
      const sentByName = await actorNameOf(ctx);
      const { provider, sent } = await forCrmUser(() => sendFromAnyMailbox(input, sentByName));
      const summary = `Sent "${sent.subject}" from ${sent.mailbox} to ${sent.to.join(', ')}`;
      const audit = provider === 'MICROSOFT' ? auditMicrosoft : auditGmail;
      await audit(ctx, 'CREATE', { id: sent.gmailId, label: sent.subject }, summary);
      return sent;
    },
    draftCrmEmail: async (
      _p: unknown,
      { input }: { input: DraftCrmEmailInput },
      ctx: GraphQLContext,
    ) => {
      const user = await crmUser(ctx, 'CREATE');
      return draftCrmEmail(input, { id: user.id, name: user.email });
    },
    crmRecordSummary: async (
      _p: unknown,
      { object, id }: { object: Kind; id: string },
      ctx: GraphQLContext,
    ) => {
      const user = await crmUser(ctx, 'VIEW');
      return summariseCrmRecord(object, id, { id: user.id, name: user.email });
    },
  },
};
