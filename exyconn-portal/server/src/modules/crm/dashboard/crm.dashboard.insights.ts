import { CompanyModel } from '../company.model';
import { DealModel, CLOSED_DEAL_STAGES } from '../deal.model';
import type { CrmKpis } from './crm.dashboard.kpis';

/** Fewer records than this in a group and a conversion rate is noise, not a finding. */
export const MIN_SAMPLE = 5;
/** How much better one group must convert before it is worth saying. */
export const MIN_RATIO = 1.5;
/** An open deal untouched this long is stuck. */
export const STUCK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type InsightKind =
  | 'LEAD_SOURCE_CONVERSION'
  | 'COMPANY_ORIGIN_CONVERSION'
  | 'STUCK_DEALS'
  | 'PAST_CLOSE_DATE'
  | 'OVERDUE_REMINDERS'
  | 'OVERDUE_TASKS';

/**
 * One finding. The sentence is written by the client from `kind` and these values, so it is
 * translated like every other string; the server only decides what is true.
 */
export interface Insight {
  kind: InsightKind;
  tone: 'POSITIVE' | 'WARNING';
  count: number;
  /** The group the finding is about: a lead source, an origin, a stage. */
  label: string;
  /** The group it is compared with. */
  compareLabel: string;
  ratio: number;
  days: number;
}

/** A group and how many of it converted. */
export interface Converted {
  label: string;
  count: number;
  converted: number;
}

const blank = { count: 0, label: '', compareLabel: '', ratio: 0, days: 0 };

/**
 * "X converts N× better than Y": the best and worst converting groups with enough records,
 * when the gap is wide enough to matter. Nothing when the worst never converts — "infinitely
 * better" is not a ratio anybody can act on.
 */
export function conversionInsight(kind: InsightKind, groups: readonly Converted[]): Insight | null {
  const rated = groups
    .filter((group) => group.count >= MIN_SAMPLE)
    .map((group) => ({ ...group, rate: group.converted / group.count }))
    .sort((a, b) => b.rate - a.rate || a.label.localeCompare(b.label));
  if (rated.length < 2) {
    return null;
  }
  const best = rated[0];
  const worst = rated.at(-1)!;
  if (worst.rate === 0 || best.rate / worst.rate < MIN_RATIO) {
    return null;
  }
  return {
    ...blank,
    kind,
    tone: 'POSITIVE',
    count: best.count,
    label: best.label,
    compareLabel: worst.label,
    ratio: Math.round((best.rate / worst.rate) * 10) / 10,
  };
}

/** Companies filed in the window by where they came from, and how many became clients. */
export async function companiesByOrigin(from: Date, to: Date): Promise<Converted[]> {
  return CompanyModel.aggregate<Converted>([
    { $match: { createdAt: { $gte: from, $lt: to }, 'origin.source': { $ne: null } } },
    {
      $group: {
        _id: '$origin.source',
        count: { $sum: 1 },
        converted: {
          $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$clientId', ''] } }, 0] }, 1, 0] },
        },
      },
    },
    { $project: { _id: 0, label: '$_id', count: 1, converted: 1 } },
  ]);
}

/** The stage holding the most open deals nobody has touched in {@link STUCK_DAYS} days. */
export async function stuckDeals(now: Date): Promise<Insight | null> {
  const [worst] = await DealModel.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        stage: { $nin: [...CLOSED_DEAL_STAGES] },
        updatedAt: { $lt: new Date(now.getTime() - STUCK_DAYS * DAY_MS) },
      },
    },
    { $group: { _id: '$stage', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 1 },
  ]);
  if (!worst) {
    return null;
  }
  return {
    ...blank,
    kind: 'STUCK_DEALS',
    tone: 'WARNING',
    count: worst.count,
    label: worst._id,
    days: STUCK_DAYS,
  };
}

/** Open deals whose expected close date has passed. */
export async function pastCloseDate(now: Date): Promise<Insight | null> {
  const count = await DealModel.countDocuments({
    stage: { $nin: [...CLOSED_DEAL_STAGES] },
    expectedCloseDate: { $ne: null, $lt: now },
  });
  return count > 0 ? { ...blank, kind: 'PAST_CLOSE_DATE', tone: 'WARNING', count } : null;
}

/** The overdue counts the KPIs already hold, as findings. */
export function overdueInsights(
  kpis: Pick<CrmKpis, 'overdueReminders' | 'overdueTasks'>,
): Insight[] {
  const found: Insight[] = [];
  if (kpis.overdueReminders > 0) {
    found.push({
      ...blank,
      kind: 'OVERDUE_REMINDERS',
      tone: 'WARNING',
      count: kpis.overdueReminders,
    });
  }
  if (kpis.overdueTasks > 0) {
    found.push({ ...blank, kind: 'OVERDUE_TASKS', tone: 'WARNING', count: kpis.overdueTasks });
  }
  return found;
}

/** Warnings first: what needs doing today reads before what is going well. */
export function rankInsights(found: ReadonlyArray<Insight | null>): Insight[] {
  const kept = found.filter((insight): insight is Insight => insight !== null);
  return [
    ...kept.filter((insight) => insight.tone === 'WARNING'),
    ...kept.filter((insight) => insight.tone !== 'WARNING'),
  ];
}
