import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPermission } from '../../lib/permissions';
import { assertPlatformStaff } from '../../lib/platformAccess';
import { currentOrganizationId } from '../../lib/tenant';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import { recordAudit } from '../audit';
import { assertOperatorCrm } from '../gmail/gmail.crm';
import {
  presentMicrosoftConfig,
  readMicrosoftConfig,
  saveMicrosoftConfig,
  startMicrosoftConnect,
  testMicrosoftMail,
  type MicrosoftMailConfigInput,
} from './microsoft.connect';
import {
  disconnectMicrosoftAccount,
  listMicrosoftAccounts,
  presentMicrosoftAccount,
  setMicrosoftAccountEnabled,
} from './microsoft.accounts';
import { microsoftApp } from './microsoft.client';
import { auditMicrosoft } from './microsoft.audit';

const TECH_MODULE = 'TechConfig';
const techStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, TECH_MODULE, [ROLES.TECH], action);
/** Every mailbox call: a CRM user with the right, in the operator's own CRM (as for Gmail). */
const crmMailbox = async (ctx: GraphQLContext, action: PermissionAction) => {
  const user = await assertPermission(ctx, 'Activity', [ROLES.CRM], action);
  await assertOperatorCrm();
  return user;
};

export const microsoftMailResolvers = {
  MicrosoftMailAccount: {
    lastUsedAt: (row: { lastUsedAt?: Date | null }) => row.lastUsedAt ?? null,
  },
  Query: {
    microsoftMailConfig: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'VIEW');
      return presentMicrosoftConfig(await readMicrosoftConfig());
    },
    microsoftMailAccounts: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crmMailbox(ctx, 'VIEW');
      return (await listMicrosoftAccounts()).map(presentMicrosoftAccount);
    },
    microsoftMailClientReady: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crmMailbox(ctx, 'VIEW');
      return microsoftApp().then(
        () => true,
        () => false,
      );
    },
  },
  Mutation: {
    saveMicrosoftMailConfig: async (
      _p: unknown,
      { input }: { input: MicrosoftMailConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      const saved = await saveMicrosoftConfig(input, await actorNameOf(ctx));
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: TECH_MODULE,
        entityId: 'microsoft-mail',
        entityLabel: 'Microsoft mail',
        summary: `Saved the Microsoft mail app (${input.enabled ? 'on' : 'off'})`,
      });
      return presentMicrosoftConfig(saved);
    },
    testMicrosoftMailConfig: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      return testMicrosoftMail();
    },
    startMicrosoftMailConnect: async (
      _p: unknown,
      { returnTo }: { returnTo: string },
      ctx: GraphQLContext,
    ) => {
      const user = await crmMailbox(ctx, 'EDIT');
      return startMicrosoftConnect(returnTo, {
        id: user.id,
        name: await actorNameOf(ctx),
        organizationId: currentOrganizationId() ?? '',
      });
    },
    setMicrosoftMailAccountEnabled: async (
      _p: unknown,
      { id, enabled }: { id: string; enabled: boolean },
      ctx: GraphQLContext,
    ) => {
      await crmMailbox(ctx, 'EDIT');
      const saved = await setMicrosoftAccountEnabled(id, enabled);
      const summary = `${enabled ? 'Turned on' : 'Turned off'} the Microsoft mailbox ${saved.email} for the CRM`;
      await auditMicrosoft(ctx, 'UPDATE', { id, label: saved.email }, summary);
      return presentMicrosoftAccount(saved);
    },
    disconnectMicrosoftMailAccount: async (
      _p: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      await crmMailbox(ctx, 'EDIT');
      const removed = await disconnectMicrosoftAccount(id);
      const summary = `Disconnected the Microsoft mailbox ${removed.email}`;
      await auditMicrosoft(ctx, 'DELETE', { id, label: removed.email }, summary);
      return true;
    },
  },
};
