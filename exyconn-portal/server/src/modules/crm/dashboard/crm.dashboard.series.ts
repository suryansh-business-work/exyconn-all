import { LeadModel } from '../crm.model';
import { DealModel, DEAL_STAGES, CLOSED_DEAL_STAGES } from '../deal.model';
import { ActivityModel, ACTIVITY_TYPES } from '../activity.model';
import { periodKeyExpression, type Granularity, type Period } from './crm.dashboard.range';

/** How many people the "top owners" chart ranks. */
const TOP_OWNERS = 5;

/** The window and the zone every series is read in. */
export interface SeriesScope {
  from: Date;
  to: Date;
  granularity: Granularity;
  timezone: string;
}

const OPEN_STAGES = DEAL_STAGES.filter((stage) => !CLOSED_DEAL_STAGES.has(stage));

/** The open pipeline per stage, in pipeline order, with empty stages as zero. A snapshot of now. */
export async function pipelineByStage() {
  const rows = await DealModel.aggregate<{ _id: string; count: number; value: number }>([
    { $match: { stage: { $in: OPEN_STAGES } } },
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
  ]);
  const byStage = new Map(rows.map((row) => [row._id, row]));
  return OPEN_STAGES.map((stage) => ({
    stage,
    count: byStage.get(stage)?.count ?? 0,
    value: byStage.get(stage)?.value ?? 0,
  }));
}

/** Won value and count per period, every period present. */
export async function wonOverTime(scope: SeriesScope, periods: readonly Period[]) {
  const rows = await DealModel.aggregate<{ _id: string; count: number; value: number }>([
    { $match: { stage: 'WON', closedAt: { $gte: scope.from, $lt: scope.to } } },
    {
      $group: {
        _id: periodKeyExpression('closedAt', scope.granularity, scope.timezone),
        count: { $sum: 1 },
        value: { $sum: '$value' },
      },
    },
  ]);
  const byKey = new Map(rows.map((row) => [row._id, row]));
  return periods.map((period) => ({
    ...period,
    count: byKey.get(period.key)?.count ?? 0,
    value: byKey.get(period.key)?.value ?? 0,
  }));
}

/** Leads created in the window per source, with how many of them were won. Largest first. */
export async function leadsBySource(scope: SeriesScope) {
  return LeadModel.aggregate<{ source: string; count: number; won: number }>([
    { $match: { createdAt: { $gte: scope.from, $lt: scope.to } } },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ['$stage', 'WON'] }, 1, 0] } },
      },
    },
    { $project: { _id: 0, source: '$_id', count: 1, won: 1 } },
    { $sort: { count: -1, source: 1 } },
  ]);
}

type TypeCounts = Record<(typeof ACTIVITY_TYPES)[number], number>;

const noActivity = (): TypeCounts => ({ CALL: 0, EMAIL: 0, MEETING: 0, NOTE: 0, TASK: 0 });

/** Activities logged per period, split by type, every period present. */
export async function activitiesOverTime(scope: SeriesScope, periods: readonly Period[]) {
  const rows = await ActivityModel.aggregate<{
    _id: { period: string; type: keyof TypeCounts };
    count: number;
  }>([
    { $match: { createdAt: { $gte: scope.from, $lt: scope.to } } },
    {
      $group: {
        _id: {
          period: periodKeyExpression('createdAt', scope.granularity, scope.timezone),
          type: '$type',
        },
        count: { $sum: 1 },
      },
    },
  ]);
  const byKey = new Map<string, TypeCounts>();
  for (const row of rows) {
    const counts = byKey.get(row._id.period) ?? noActivity();
    counts[row._id.type] = row.count;
    byKey.set(row._id.period, counts);
  }
  return periods.map((period) => {
    const counts = byKey.get(period.key) ?? noActivity();
    return {
      ...period,
      call: counts.CALL,
      email: counts.EMAIL,
      meeting: counts.MEETING,
      note: counts.NOTE,
      task: counts.TASK,
    };
  });
}

/** The people who won the most value in the window. */
export async function topOwners(scope: SeriesScope) {
  return DealModel.aggregate<{ owner: string; value: number; count: number }>([
    { $match: { stage: 'WON', closedAt: { $gte: scope.from, $lt: scope.to } } },
    { $group: { _id: '$owner', value: { $sum: '$value' }, count: { $sum: 1 } } },
    { $project: { _id: 0, owner: '$_id', value: 1, count: 1 } },
    { $sort: { value: -1, owner: 1 } },
    { $limit: TOP_OWNERS },
  ]);
}
