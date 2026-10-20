import { Types, type FilterQuery } from 'mongoose';
import {
  MaActionItemModel,
  MaMeetingModel,
  MaParticipantModel,
  type MaMeetingDocument,
} from './models';
import { OPEN_ACTION_STATUSES } from './ma.enums';
import { monthStart } from './settings.service';

export interface DashboardFilter {
  from?: Date | null;
  to?: Date | null;
  ownerId?: string | null;
  participantUserId?: string | null;
  status?: string | null;
  language?: string | null;
}

/** How many days the per-day series covers. */
const SERIES_DAYS = 30;

/** The filter's meeting conditions, on top of the caller's scope. */
export async function dashboardMatch(
  scope: FilterQuery<MaMeetingDocument>,
  filter: DashboardFilter,
): Promise<FilterQuery<MaMeetingDocument>> {
  const match: FilterQuery<MaMeetingDocument> = { ...scope };
  if (filter.from || filter.to) {
    match.startedAt = {
      ...(filter.from ? { $gte: filter.from } : {}),
      ...(filter.to ? { $lte: filter.to } : {}),
    };
  }
  if (filter.ownerId) {
    match.ownerId = filter.ownerId;
  }
  if (filter.status) {
    match.status = filter.status;
  }
  if (filter.language) {
    match.language = filter.language;
  }
  if (filter.participantUserId) {
    const ids: string[] = await MaParticipantModel.find({
      userId: filter.participantUserId,
    }).distinct('meetingId');
    // An aggregate's $match is not cast by Mongoose, so the ids must already be ObjectIds.
    match._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
  }
  return match;
}

interface MeetingTotals {
  total: number;
  thisMonth: number;
  seconds: number;
  notes: number;
  failures: number;
  cost: number;
}

/**
 * Every dashboard figure for the meetings a filter selects. Each figure is defined where
 * the portal shows it (the (i) beside each tile), and computed here exactly that way.
 */
export async function meetingDashboard(match: FilterQuery<MaMeetingDocument>, now = new Date()) {
  const [facets] = await MaMeetingModel.aggregate<{
    totals: MeetingTotals[];
    byLanguage: Array<{ _id: string; count: number }>;
    byDay: Array<{ _id: string; count: number }>;
    ids: Array<{ _id: unknown }>;
  }>([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              thisMonth: { $sum: { $cond: [{ $gte: ['$startedAt', monthStart(now)] }, 1, 0] } },
              seconds: {
                $sum: {
                  $divide: [{ $subtract: [{ $ifNull: ['$endedAt', now] }, '$startedAt'] }, 1000],
                },
              },
              notes: { $sum: { $cond: [{ $eq: ['$summaryStatus', 'READY'] }, 1, 0] } },
              failures: { $sum: '$transcriptionFailures' },
              cost: { $sum: '$costUsd' },
            },
          },
        ],
        byLanguage: [
          { $group: { _id: '$language', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        byDay: [
          { $match: { startedAt: { $gte: new Date(now.getTime() - SERIES_DAYS * 86_400_000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        ids: [{ $project: { _id: 1 } }],
      },
    },
  ]);
  const totals = facets?.totals[0];
  const ids = (facets?.ids ?? []).map((row) => String(row._id));
  const open = [...OPEN_ACTION_STATUSES];
  const inMeetings = { meetingId: { $in: ids } };
  const [pendingActions, completedActions, overdueActions] = await Promise.all([
    MaActionItemModel.countDocuments({ ...inMeetings, status: { $in: open } }),
    MaActionItemModel.countDocuments({ ...inMeetings, status: 'COMPLETED' }),
    MaActionItemModel.countDocuments({
      ...inMeetings,
      status: { $in: open },
      dueDate: { $lt: now },
    }),
  ]);
  return {
    totalMeetings: totals?.total ?? 0,
    meetingsThisMonth: totals?.thisMonth ?? 0,
    totalDurationSeconds: Math.round(totals?.seconds ?? 0),
    notesGenerated: totals?.notes ?? 0,
    pendingActions,
    completedActions,
    overdueActions,
    transcriptionFailures: totals?.failures ?? 0,
    costUsd: totals?.cost ?? 0,
    byLanguage: (facets?.byLanguage ?? []).map((row) => ({ value: row._id, count: row.count })),
    byDay: (facets?.byDay ?? []).map((row) => ({ value: row._id, count: row.count })),
  };
}
