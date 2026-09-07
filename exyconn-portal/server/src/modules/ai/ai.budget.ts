import { AiJobModel } from './ai.model';
import { AiSpendLimitModel, AI_SPEND_LIMIT_KEY } from './ai-spend-limit.model';
import { badRequest } from '../../utils/errors';

/** Where the caps are edited, named in every refusal so the message is actionable. */
const WHERE_TO_EDIT = 'Tech › Environment Variables › AI Pricing';

/** One row of the spend summary. */
export interface SpendBucket {
  usd: number;
  jobs: number;
}

export interface UserSpend extends SpendBucket {
  userId: string;
  name: string;
}

export interface ModelSpend extends SpendBucket {
  model: string;
}

export interface AiSpendSummary {
  totalUsd: number;
  byUser: UserSpend[];
  byModel: ModelSpend[];
}

/** US dollars, as a refusal should say them. */
function usd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Midnight today, in the process's own clock. */
function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** The first instant of the calendar month the caps are measured over. */
function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** The limit document, created with its defaults the first time it is read. */
export async function readAiSpendLimit() {
  return AiSpendLimitModel.findOneAndUpdate(
    { key: AI_SPEND_LIMIT_KEY },
    { $setOnInsert: { key: AI_SPEND_LIMIT_KEY } },
    { new: true, upsert: true },
  ).lean();
}

/** What the matching jobs cost in total. Only finished runs carry a cost. */
async function spend(match: Record<string, unknown>): Promise<number> {
  const [row] = await AiJobModel.aggregate<{ total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$costUsd' } } },
  ]);
  return row?.total ?? 0;
}

/**
 * Refuses a run that would spend past a cap the business set.
 *
 * Checked before the request goes out rather than after, and stated with both the cap and
 * what has already gone on it — "over budget" on its own tells nobody what to do next.
 */
export async function assertWithinAiBudget(userId: string, now = new Date()): Promise<void> {
  const limit = await readAiSpendLimit();
  if (!limit.enabled) {
    return;
  }

  if (limit.monthlyUsdCap > 0) {
    const month = await spend({ ranAt: { $gte: startOfMonth(now) } });
    if (month >= limit.monthlyUsdCap) {
      badRequest(
        `The monthly AI budget of ${usd(limit.monthlyUsdCap)} is used up — ${usd(month)} spent this month. Raise it in ${WHERE_TO_EDIT}.`,
      );
    }
  }

  if (limit.perUserDailyUsdCap > 0 && userId) {
    const today = await spend({ createdById: userId, ranAt: { $gte: startOfToday(now) } });
    if (today >= limit.perUserDailyUsdCap) {
      badRequest(
        `Your daily AI budget of ${usd(limit.perUserDailyUsdCap)} is used up — ${usd(today)} spent today. Raise it in ${WHERE_TO_EDIT}.`,
      );
    }
  }
}

/** Groups finished runs in the window by one field, most expensive first. */
async function groupSpend(from: Date, to: Date, field: string) {
  return AiJobModel.aggregate<{ _id: string; name: string; usd: number; jobs: number }>([
    { $match: { ranAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: `$${field}`,
        name: { $last: '$createdByName' },
        usd: { $sum: '$costUsd' },
        jobs: { $sum: 1 },
      },
    },
    { $sort: { usd: -1 } },
  ]);
}

/**
 * What AI cost over a window, and who and what it went on. One aggregation per axis, so
 * the AI overview answers "where is the money going" without reading every job row.
 */
export async function aiSpendSummary(from: Date, to: Date): Promise<AiSpendSummary> {
  const [byUserRows, byModelRows] = await Promise.all([
    groupSpend(from, to, 'createdById'),
    groupSpend(from, to, 'model'),
  ]);

  return {
    totalUsd: byModelRows.reduce((total, row) => total + row.usd, 0),
    byUser: byUserRows.map((row) => ({
      userId: row._id ?? '',
      name: row.name || 'Unattributed',
      usd: row.usd,
      jobs: row.jobs,
    })),
    byModel: byModelRows.map((row) => ({ model: row._id ?? '', usd: row.usd, jobs: row.jobs })),
  };
}
