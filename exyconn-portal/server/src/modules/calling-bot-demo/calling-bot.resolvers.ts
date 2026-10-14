import { canPhone, type CallingBotConfigRecord } from '@exyconn/calling-bot-demo-server';
import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import { assertRole } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import type { PermissionAction } from '../permissions/permission.model';
import { secretHint } from '../tech/tech.secrets';
import { callingBotCalls, type Caller, type StartCallInput } from './calling-bot.calls.service';
import { callingBotConfigs, type CallingBotConfigInput } from './calling-bot.config.service';

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

export const callingBotResolvers = {
  CallingBotConfig: {
    hasSarvamApiKey: (row: CallingBotConfigRecord) => Boolean(row.sarvamApiKey),
    sarvamApiKeyHint: (row: CallingBotConfigRecord) => secretHint(row.sarvamApiKey),
    hasOpenAiApiKey: (row: CallingBotConfigRecord) => Boolean(row.openAiApiKey),
    openAiApiKeyHint: (row: CallingBotConfigRecord) => secretHint(row.openAiApiKey),
    hasVobizAuthToken: (row: CallingBotConfigRecord) => Boolean(row.vobizAuthToken),
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
      return withId(await callingBotConfigs.create(input));
    },
    updateCallingBotConfig: async (
      _p: unknown,
      { id, input }: Id & { input: CallingBotConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      return withId(await callingBotConfigs.update(id, input));
    },
    deleteCallingBotConfig: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techStaff(ctx, 'DELETE');
      return callingBotConfigs.remove(id);
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
