import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPermission } from '../../lib/permissions';
import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import type { GraphQLContext } from '../../middleware/auth';
import { assertRole } from '../../middleware/roleGuard';
import type { PermissionAction } from '../permissions/permission.model';
import { callConfigs, smsConfigs } from './crm-integrations.configs';
import { placeBridgeCall, testCallConfig } from './crm-integrations.call';
import { sendSms, testSmsConfig } from './crm-integrations.sms';
import { crmEmailSenders, emailReadiness } from './crm-integrations.email';
import {
  CRM_INTEGRATION_MODULE,
  assertRecordEdit,
  auditIntegration,
  logActivity,
  recordFor,
  type RecordObject,
} from './crm-integrations.record';
import { checkedPhone, checkedSmsBody } from './crm-integrations.validation';

/** Managing the company's accounts is a CRM administrator's job (Admin > Permissions). */
const manager = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPermission(ctx, CRM_INTEGRATION_MODULE, [ROLES.CRM], action);

/** Every call and text costs the company money and reaches a person: limited per user, per hour. */
const callLimiter = createLimiter({ keyPrefix: 'crm-call', points: 30, durationSec: 3600 });
const smsLimiter = createLimiter({ keyPrefix: 'crm-sms', points: 60, durationSec: 3600 });

const PROVIDER_NAMES: Readonly<Record<string, string>> = {
  TWILIO: 'Twilio',
  VOBIZ: 'Vobiz',
  MSG91: 'MSG91',
};

type Store = typeof callConfigs | typeof smsConfigs;
type ConfigRow = { id: string; label: string; provider: string };

/** Create, update, delete and test for one store, each audited by name and provider only. */
function configMutations(
  store: Store,
  kind: 'call' | 'SMS',
  test: (id: string) => Promise<string>,
) {
  const audit = (ctx: GraphQLContext, row: ConfigRow, action: 'CREATE' | 'UPDATE' | 'DELETE') => {
    const verb = { CREATE: 'Added', UPDATE: 'Updated', DELETE: 'Removed' }[action];
    const summary = `${verb} the ${PROVIDER_NAMES[row.provider]} ${kind} integration ${row.label}`;
    return auditIntegration(ctx, { id: row.id, label: row.label }, action, summary);
  };
  return {
    create: async (_p: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
      await manager(ctx, 'CREATE');
      const row = await store.create(input, await actorNameOf(ctx));
      await audit(ctx, row, 'CREATE');
      return row;
    },
    update: async (
      _p: unknown,
      { id, input }: { id: string; input: unknown },
      ctx: GraphQLContext,
    ) => {
      await manager(ctx, 'EDIT');
      const row = await store.update(id, input, await actorNameOf(ctx));
      await audit(ctx, row, 'UPDATE');
      return row;
    },
    remove: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await manager(ctx, 'DELETE');
      await audit(ctx, await store.remove(id), 'DELETE');
      return true;
    },
    test: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await manager(ctx, 'EDIT');
      return test(id);
    },
  };
}

const callMutations = configMutations(callConfigs, 'call', testCallConfig);
const smsMutations = configMutations(smsConfigs, 'SMS', testSmsConfig);

const channelStatus = (config: { provider: string } | null) => ({
  ready: Boolean(config),
  provider: config?.provider ?? null,
});

interface Reach {
  object: RecordObject;
  id: string;
  to: string;
}

export const crmIntegrationsResolvers = {
  Query: {
    crmIntegrationStatus: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, [ROLES.CRM]);
      const [call, sms, email] = await Promise.all([
        callConfigs.active(),
        smsConfigs.active(),
        emailReadiness(),
      ]);
      return { call: channelStatus(call), sms: channelStatus(sms), email };
    },
    crmCallConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await manager(ctx, 'VIEW');
      return callConfigs.list();
    },
    crmSmsConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await manager(ctx, 'VIEW');
      return smsConfigs.list();
    },
    crmEmailSenders: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await assertPermission(ctx, 'Activity', [ROLES.CRM], 'VIEW');
      return crmEmailSenders();
    },
  },
  Mutation: {
    createCrmCallConfig: callMutations.create,
    updateCrmCallConfig: callMutations.update,
    deleteCrmCallConfig: callMutations.remove,
    testCrmCallConfig: callMutations.test,
    createCrmSmsConfig: smsMutations.create,
    updateCrmSmsConfig: smsMutations.update,
    deleteCrmSmsConfig: smsMutations.remove,
    testCrmSmsConfig: smsMutations.test,

    startCrmCall: async (
      _p: unknown,
      { input }: { input: Reach & { agentPhone: string } },
      ctx: GraphQLContext,
    ) => {
      const user = await assertRecordEdit(ctx, input.object);
      const to = checkedPhone(input.to, 'the number to call');
      const agentPhone = checkedPhone(input.agentPhone, 'your phone number');
      const record = await recordFor(input.object, input.id, to);
      await enforceLimit(callLimiter, user.id, 'calls');
      const placed = await placeBridgeCall({ agentPhone, contactPhone: to });
      const provider = PROVIDER_NAMES[placed.provider];
      const activityId = await logActivity({
        object: input.object,
        record,
        type: 'CALL',
        subject: `Call to ${record.name}`,
        notes: `Click-to-call to ${to} through ${provider}.`,
        owner: await actorNameOf(ctx),
      });
      await auditIntegration(
        ctx,
        { id: record.id, label: record.name },
        'CREATE',
        `Called ${record.name} through ${provider}`,
      );
      return { ...placed, activityId };
    },

    sendCrmSms: async (
      _p: unknown,
      { input }: { input: Reach & { body: string } },
      ctx: GraphQLContext,
    ) => {
      const user = await assertRecordEdit(ctx, input.object);
      const to = checkedPhone(input.to, 'the number to text');
      const body = checkedSmsBody(input.body);
      const record = await recordFor(input.object, input.id, to);
      await enforceLimit(smsLimiter, user.id, 'text messages');
      const sent = await sendSms(to, body);
      const provider = PROVIDER_NAMES[sent.provider];
      const activityId = await logActivity({
        object: input.object,
        record,
        type: 'NOTE',
        subject: `SMS to ${record.name} (${to})`,
        notes: body,
        owner: await actorNameOf(ctx),
      });
      await auditIntegration(
        ctx,
        { id: record.id, label: record.name },
        'CREATE',
        `Texted ${record.name} through ${provider}`,
      );
      return { ...sent, activityId };
    },
  },
};
