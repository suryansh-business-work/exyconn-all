import { LeadModel } from '../crm.model';
import { CompanyModel } from '../company.model';
import { ContactModel } from '../contact.model';
import { DealModel, CLOSED_DEAL_STAGES } from '../deal.model';
import { ActivityModel } from '../activity.model';
import { MeetingBookingModel } from '../meetings/meeting.models';

/** The headline numbers for a window. Open pipeline and overdue work are as of now. */
export interface CrmKpis {
  openDealCount: number;
  openPipelineValue: number;
  weightedPipelineValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  /** Won over won + lost in the window, 0-1; null when nothing closed. */
  winRate: number | null;
  newLeads: number;
  newContacts: number;
  newCompanies: number;
  overdueTasks: number;
  overdueReminders: number;
  meetingsBooked: number;
}

/** Open deals: count, face value and probability-weighted value. */
async function openPipeline() {
  const [row] = await DealModel.aggregate<{ count: number; value: number; weighted: number }>([
    { $match: { stage: { $nin: [...CLOSED_DEAL_STAGES] } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        value: { $sum: '$value' },
        weighted: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } },
      },
    },
  ]);
  return row ?? { count: 0, value: 0, weighted: 0 };
}

/** Deals that closed in the window, per outcome. */
async function closedIn(from: Date, to: Date) {
  const rows = await DealModel.aggregate<{ _id: string; count: number; value: number }>([
    { $match: { stage: { $in: [...CLOSED_DEAL_STAGES] }, closedAt: { $gte: from, $lt: to } } },
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
  ]);
  const won = rows.find((row) => row._id === 'WON');
  const lost = rows.find((row) => row._id === 'LOST');
  return { won: won ?? { count: 0, value: 0 }, lostCount: lost?.count ?? 0 };
}

/** The filter for unfinished work whose date has passed. */
export const overdueFilter = (field: 'dueDate' | 'remindAt', now: Date) => ({
  done: false,
  archivedAt: null,
  [field]: { $ne: null, $lt: now },
});

/** Every headline number, in parallel; each is one indexed count or aggregation. */
export async function crmKpis(from: Date, to: Date, now: Date): Promise<CrmKpis> {
  const created = { createdAt: { $gte: from, $lt: to } };
  const [
    open,
    closed,
    newLeads,
    newContacts,
    newCompanies,
    overdueTasks,
    overdueReminders,
    booked,
  ] = await Promise.all([
    openPipeline(),
    closedIn(from, to),
    LeadModel.countDocuments(created),
    ContactModel.countDocuments(created),
    CompanyModel.countDocuments(created),
    ActivityModel.countDocuments({ ...overdueFilter('dueDate', now), remindAt: null }),
    ActivityModel.countDocuments(overdueFilter('remindAt', now)),
    MeetingBookingModel.countDocuments({ ...created, status: 'CONFIRMED' }),
  ]);
  const decided = closed.won.count + closed.lostCount;
  return {
    openDealCount: open.count,
    openPipelineValue: open.value,
    weightedPipelineValue: open.weighted,
    wonCount: closed.won.count,
    wonValue: closed.won.value,
    lostCount: closed.lostCount,
    winRate: decided > 0 ? closed.won.count / decided : null,
    newLeads,
    newContacts,
    newCompanies,
    overdueTasks,
    overdueReminders,
    meetingsBooked: booked,
  };
}
