import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPermission } from '../../lib/permissions';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import { recordAudit } from '../audit';
import { draftCrmEmail, summariseCrmRecord, type DraftCrmEmailInput } from '../crm/crm.ai';
import {
  disconnectGmail,
  presentGmailConfig,
  readGmailConfig,
  saveGmailConfig,
  startGmailConnect,
  testGmail,
  type GmailConfigInput,
} from './gmail.connect';
import {
  assertOperatorCrm,
  crmEmailThreads,
  sendCrmEmail,
  type SendCrmEmailInput,
} from './gmail.crm';
import { connectedConfig } from './gmail.client';

const TECH_MODULE = 'TechConfig';
const techStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, TECH_MODULE, [ROLES.TECH], action);
/** Emailing a contact is a CRM activity; reading their mail needs to see the contact. */
const crmUser = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, 'Activity', [ROLES.CRM], action);

type Kind = 'CONTACT' | 'COMPANY';

const audited = async (ctx: GraphQLContext, summary: string) =>
  recordAudit(ctx, {
    action: 'UPDATE',
    module: TECH_MODULE,
    entityId: 'gmail',
    entityLabel: 'Gmail',
    summary,
  });

export const gmailResolvers = {
  CrmEmailMessage: {
    id: (row: { id?: string; gmailId: string }) => row.id ?? row.gmailId,
    sentByName: (row: { sentByName?: string | null }) => row.sentByName ?? '',
  },
  Query: {
    gmailConfig: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'VIEW');
      return presentGmailConfig(await readGmailConfig());
    },
    crmEmailThreads: async (
      _p: unknown,
      { object, id }: { object: Kind; id: string },
      ctx: GraphQLContext,
    ) => {
      await crmUser(ctx, 'VIEW');
      return crmEmailThreads(object, id);
    },
    crmGmailReady: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crmUser(ctx, 'VIEW');
      try {
        await assertOperatorCrm();
        await connectedConfig();
        return true;
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
      await audited(ctx, `Saved the Gmail connection (${input.enabled ? 'on' : 'off'})`);
      return presentGmailConfig(saved);
    },
    startGmailConnect: async (
      _p: unknown,
      { returnTo }: { returnTo: string },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      return startGmailConnect(returnTo, await actorNameOf(ctx));
    },
    disconnectGmail: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      const saved = await disconnectGmail(await actorNameOf(ctx));
      await audited(ctx, 'Disconnected Gmail');
      return presentGmailConfig(saved);
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
      return sendCrmEmail(input, await actorNameOf(ctx));
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
