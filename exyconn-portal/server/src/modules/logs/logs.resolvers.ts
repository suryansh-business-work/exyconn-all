import { AppLogGroupModel } from './app-log-group.model';
import { AppLogEventModel } from './app-log-event.model';
import { ingestLogBatch, type LogBatchInput } from './logs.ingest';
import {
  deleteAppLogGroup,
  getAppLogGroup,
  listAppLogEvents,
  listAppLogGroupsPaged,
  listAppLogGroupsStats,
  setAppLogGroupStatus,
} from './logs.service';
import { buildFixPrompt, buildOpenErrorsPrompt } from './logs.prompt';
import {
  PROMPT_EVENTS_LIMIT,
  PROMPT_OPEN_GROUPS_LIMIT,
  type AppLogSource,
  type AppLogStatus,
} from './logs.constants';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { TableQueryInput } from '../../utils/tableQuery';

type LeanDoc = { _id: unknown };
type Action = 'VIEW' | 'EDIT' | 'DELETE';

const LOG_ROLES = [ROLES.TECH];

const guard = (ctx: GraphQLContext, action: Action) =>
  assertPermission(ctx, 'AppLog', LOG_ROLES, action);

async function openErrorsPrompt(source: AppLogSource | null | undefined): Promise<string> {
  const filter = source
    ? { status: 'OPEN', level: 'ERROR', source }
    : { status: 'OPEN', level: 'ERROR' };
  const groups = await AppLogGroupModel.find(filter)
    .sort({ lastSeenAt: -1 })
    .limit(PROMPT_OPEN_GROUPS_LIMIT)
    .lean();
  const withLatest = await Promise.all(
    groups.map(async (group) => ({
      group,
      latest:
        (await AppLogEventModel.findOne({ groupId: group._id }).sort({ occurredAt: -1 }).lean()) ??
        undefined,
    })),
  );
  return buildOpenErrorsPrompt(withLatest);
}

export const logsResolvers = {
  Query: {
    listAppLogGroupsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      const page = await listAppLogGroupsPaged(input);
      return { rows: withIds(page.rows as LeanDoc[]), totalCount: page.totalCount };
    },
    listAppLogGroupsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return listAppLogGroupsStats();
    },
    getAppLogGroup: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return withId(await getAppLogGroup(id));
    },
    listAppLogEvents: async (
      _p: unknown,
      { groupId }: { groupId: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return withIds(await listAppLogEvents(groupId));
    },
    appLogFixPrompt: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      const group = await getAppLogGroup(id);
      return buildFixPrompt(group, await listAppLogEvents(id, PROMPT_EVENTS_LIMIT));
    },
    openAppLogsFixPrompt: async (
      _p: unknown,
      { source }: { source?: AppLogSource | null },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return openErrorsPrompt(source);
    },
  },
  Mutation: {
    reportClientLogs: (_p: unknown, { input }: { input: LogBatchInput }, ctx: GraphQLContext) =>
      ingestLogBatch(input, { user: ctx.user, ip: ctx.ip, userAgent: ctx.userAgent }),
    setAppLogGroupStatus: async (
      _p: unknown,
      { id, status }: { id: string; status: AppLogStatus },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      return withId(await setAppLogGroupStatus(id, status));
    },
    deleteAppLogGroup: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      return deleteAppLogGroup(id);
    },
  },
};
