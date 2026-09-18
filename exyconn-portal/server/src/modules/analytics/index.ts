import { assertPlatformAdmin, assertRole } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import { MS_PER_DAY, dayKeys, houseTimezone } from './analytics.metrics';
import { employeeAnalytics, userAnalytics } from './analytics.people';
import { trackerAnalytics } from './analytics.tracker';
import { platformAnalytics } from './analytics.platform';
import { analyticsTypeDefs } from './analytics.typeDefs';

const MIN_DAYS = 1;
const MAX_DAYS = 365;

/** The company's analytics over the last `days` days, bucketed in the workspace timezone. */
async function workspaceAnalytics(_p: unknown, { days }: { days: number }, ctx: GraphQLContext) {
  assertRole(ctx, [ROLES.ADMIN]);
  if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
    badRequest(`The period must be between ${MIN_DAYS} and ${MAX_DAYS} days.`);
  }
  const timezone = await houseTimezone();
  const keys = dayKeys(days, timezone);
  const since = new Date(Date.now() - days * MS_PER_DAY);
  const [users, employees, tracker] = await Promise.all([
    userAnalytics(since, timezone, keys),
    employeeAnalytics(),
    trackerAnalytics(since, timezone, keys),
  ]);
  return { days, timezone, users, employees, tracker };
}

export const analyticsResolvers = {
  Query: {
    workspaceAnalytics,
    platformAnalytics: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertPlatformAdmin(ctx);
      return platformAnalytics();
    },
  },
};
export { analyticsTypeDefs };
