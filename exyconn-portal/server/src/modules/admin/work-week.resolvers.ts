import { assertAuthenticated } from '../../middleware/roleGuard';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { recordAudit } from '../audit';
import type { GraphQLContext } from '../../middleware/auth';
import {
  orgDefaultWorkDays,
  saveDefaultWorkDays,
  workDaysOf,
  type WorkDaysSource,
} from './work-week';

/**
 * The workspace default, read once per request: a list of users resolving `effectiveWorkDays`
 * would otherwise read the settings once per row.
 */
const defaultsByRequest = new WeakMap<GraphQLContext, Promise<number[]>>();

function requestDefault(ctx: GraphQLContext): Promise<number[]> {
  const cached = defaultsByRequest.get(ctx);
  if (cached) {
    return cached;
  }
  const read = orgDefaultWorkDays();
  defaultsByRequest.set(ctx, read);
  return read;
}

export const workWeekResolvers = {
  User: {
    /** The person's own week, or null when they follow the workspace's. */
    workDays: (parent: WorkDaysSource) => {
      const own = parent.workDays ?? [];
      return own.length > 0 ? own : null;
    },
    effectiveWorkDays: (parent: WorkDaysSource, _a: unknown, ctx: GraphQLContext) =>
      workDaysOf(parent, () => requestDefault(ctx)),
  },
  Query: {
    workWeek: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx); // any signed-in person may read the house week
      return { defaultWorkDays: await orgDefaultWorkDays() };
    },
  },
  Mutation: {
    setDefaultWorkDays: async (_p: unknown, { days }: { days: number[] }, ctx: GraphQLContext) => {
      await assertPermission(ctx, 'AppSettings', [ROLES.HR], 'EDIT');
      const before = await orgDefaultWorkDays();
      const defaultWorkDays = await saveDefaultWorkDays(days);
      await recordAudit(ctx, {
        action: 'SETTINGS',
        module: 'AppSettings',
        entityLabel: 'global',
        summary: `Set the default work week to days ${defaultWorkDays.join(', ')}`,
        changes: { defaultWorkDays: { from: before, to: defaultWorkDays } },
      });
      return { defaultWorkDays };
    },
  },
};
