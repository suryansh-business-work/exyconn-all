import { assertRole } from '../../../middleware/roleGuard';
import { ROLES } from '../../../constants/roles';
import { houseClock } from '../crm.house-clock';
import type { GraphQLContext } from '../../../middleware/auth';
import { dashboardWindow, granularityOf, periodsBetween } from './crm.dashboard.range';
import { crmKpis } from './crm.dashboard.kpis';
import {
  activitiesOverTime,
  leadsBySource,
  pipelineByStage,
  topOwners,
  wonOverTime,
  type SeriesScope,
} from './crm.dashboard.series';
import {
  companiesByOrigin,
  conversionInsight,
  overdueInsights,
  pastCloseDate,
  rankInsights,
  stuckDeals,
} from './crm.dashboard.insights';

/**
 * Everything CRM › Overview draws, for one period, in one request: the headline numbers, the
 * chart series and the findings. Each part is one aggregation over indexed fields and they run
 * in parallel — no per-record reads, whatever the size of the book.
 */
export async function crmDashboard(
  fromInput: Date | string,
  toInput: Date | string,
  now = new Date(),
) {
  const { from, to } = dashboardWindow(fromInput, toInput);
  const { timezone } = await houseClock();
  const scope: SeriesScope = { from, to, granularity: granularityOf(from, to), timezone };
  const periods = periodsBetween(from, to, scope.granularity, timezone);
  const [kpis, stages, won, sources, activities, owners, origins, stuck, late] = await Promise.all([
    crmKpis(from, to, now),
    pipelineByStage(),
    wonOverTime(scope, periods),
    leadsBySource(scope),
    activitiesOverTime(scope, periods),
    topOwners(scope),
    companiesByOrigin(from, to),
    stuckDeals(now),
    pastCloseDate(now),
  ]);
  const sourceGroups = sources.map((row) => ({
    label: row.source,
    count: row.count,
    converted: row.won,
  }));
  return {
    from,
    to,
    timezone,
    granularity: scope.granularity,
    kpis,
    pipelineByStage: stages,
    wonOverTime: won,
    leadsBySource: sources,
    activitiesOverTime: activities,
    topOwners: owners,
    insights: rankInsights([
      ...overdueInsights(kpis),
      stuck,
      late,
      conversionInsight('LEAD_SOURCE_CONVERSION', sourceGroups),
      conversionInsight('COMPANY_ORIGIN_CONVERSION', origins),
    ]),
  };
}

export const crmDashboardResolvers = {
  Query: {
    crmDashboard: async (
      _p: unknown,
      { from, to }: { from: Date | string; to: Date | string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, [ROLES.CRM]);
      return crmDashboard(from, to);
    },
  },
};
