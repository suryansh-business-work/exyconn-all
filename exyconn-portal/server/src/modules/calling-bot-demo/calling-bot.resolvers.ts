import { canPhone, type CallingBotConfigRecord } from '@exyconn/calling-bot-demo-server';
import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import { assertRole } from '../../middleware/roleGuard';
import { recordAudit } from '../audit';
import { withId, withIds } from '../../utils/serialize';
import type { PermissionAction } from '../permissions/permission.model';
import { secretHint } from '../tech/tech.secrets';
import { callingBotCalls, type Caller, type StartCallInput } from './calling-bot.calls.service';
import { testCallingBotKey, type KeyTestInput } from './calling-bot.keys.service';
import {
  callingBotConfigs,
  type CallingBotConfigInput,
  type CallingBotSecretField,
} from './calling-bot.config.service';

/** The settings sit with the install's other credentials: the platform's own Tech staff only. */
const TECH_MODULE = 'TechConfig';
const techStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, TECH_MODULE, [ROLES.TECH], action);

/** How many calls the Tech screen lists when it does not say. */
const RECENT_CALLS = 50;

/**
 * Who may call the bot: a demo visitor (email-and-code sign-in, see whatsapp-demo/visitor) or
 * any signed-in employee walking a client through it.
 */
async function callerOf(ctx: GraphQLContext): Promise<Caller> {
  const visitor = ctx.demoVisitor;
  if (visitor && !ctx.user) {
    return { id: `visitor:${visitor.id}`, name: visitor.name, email: visitor.email };
  }
  const user = assertRole(ctx, [ROLES.EMPLOYEE]);
  return { id: user.id, name: await actorNameOf(ctx), email: user.email };
}

type Id = { id: string };

/** The GraphQL names of the keys the eye button can reveal, and what the audit log calls them. */
const SECRET_FIELDS: Record<string, { field: CallingBotSecretField; name: string }> = {
  SARVAM_API_KEY: { field: 'sarvamApiKey', name: 'Sarvam AI key' },
  OPENAI_API_KEY: { field: 'openAiApiKey', name: 'OpenAI key' },
  VOBIZ_AUTH_TOKEN: { field: 'vobizAuthToken', name: 'Vobiz Auth Token' },
  TWILIO_AUTH_TOKEN: { field: 'twilioAuthToken', name: 'Twilio Auth Token' },
};

/** Every change to the settings, by whom: the keys sit with the install's other credentials. */
const auditConfig = (
  ctx: GraphQLContext,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  config: CallingBotConfigRecord,
  summary: string,
) =>
  recordAudit(ctx, {
    action,
    module: TECH_MODULE,
    entityId: config._id,
    entityLabel: config.label,
    summary,
  });

export const callingBotResolvers = {
  CallingBotConfig: {
    hasSarvamApiKey: (row: CallingBotConfigRecord) => Boolean(row.sarvamApiKey),
    sarvamApiKeyHint: (row: CallingBotConfigRecord) => secretHint(row.sarvamApiKey),
    hasOpenAiApiKey: (row: CallingBotConfigRecord) => Boolean(row.openAiApiKey),
    openAiApiKeyHint: (row: CallingBotConfigRecord) => secretHint(row.openAiApiKey),
    hasVobizAuthToken: (row: CallingBotConfigRecord) => Boolean(row.vobizAuthToken),
    hasTwilioAuthToken: (row: CallingBotConfigRecord) => Boolean(row.twilioAuthToken),
    phoneEnabled: (row: CallingBotConfigRecord) => canPhone(row),
  },
  Query: {
    callingBotConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'VIEW');
      return withIds(await callingBotConfigs.list());
    },
    callingBotRecentCalls: async (
      _p: unknown,
      { limit }: { limit?: number | null },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'VIEW');
      return withIds(await callingBotCalls.recent(Math.min(limit ?? RECENT_CALLS, 200)));
    },
    callingBotAvailability: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await callerOf(ctx);
      return callingBotCalls.availability();
    },
    callingBotCall: async (_p: unknown, { id }: Id, ctx: GraphQLContext) =>
      withId(await callingBotCalls.ownCall(await callerOf(ctx), id)),
  },
  Mutation: {
    createCallingBotConfig: async (
      _p: unknown,
      { input }: { input: CallingBotConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'CREATE');
      const created = await callingBotConfigs.create(input);
      await auditConfig(ctx, 'CREATE', created, `Added the calling bot config ${created.label}`);
      return withId(created);
    },
    updateCallingBotConfig: async (
      _p: unknown,
      { id, input }: Id & { input: CallingBotConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      const updated = await callingBotConfigs.update(id, input);
      await auditConfig(ctx, 'UPDATE', updated, `Updated the calling bot config ${updated.label}`);
      return withId(updated);
    },
    deleteCallingBotConfig: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techStaff(ctx, 'DELETE');
      const removed = await callingBotConfigs.remove(id);
      await auditConfig(ctx, 'DELETE', removed, `Deleted the calling bot config ${removed.label}`);
      return true;
    },
    revealCallingBotSecret: async (
      _p: unknown,
      { id, secret }: Id & { secret: string },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      const { field, name } = SECRET_FIELDS[secret];
      const { label, value } = await callingBotConfigs.reveal(id, field);
      await recordAudit(ctx, {
        action: 'ACCESS',
        module: TECH_MODULE,
        entityId: id,
        entityLabel: label,
        summary: `Revealed the ${name} of the calling bot config ${label}`,
      });
      return value;
    },
    testCallingBotKey: async (
      _p: unknown,
      { input }: { input: KeyTestInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      return testCallingBotKey(input);
    },
    testCallingBotConfig: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      return callingBotConfigs.test(id);
    },
    startCallingBotCall: async (
      _p: unknown,
      { input }: { input: StartCallInput },
      ctx: GraphQLContext,
    ) => {
      const { call, socketUrl } = await callingBotCalls.start(await callerOf(ctx), input);
      return { call: withId(call), socketUrl };
    },
  },
};
