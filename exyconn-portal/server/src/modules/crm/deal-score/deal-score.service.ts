import { isValidObjectId } from 'mongoose';
import { DealModel, type DealDocument } from '../deal.model';
import { ActivityModel } from '../activity.model';
import { ContactModel } from '../contact.model';
import { CLOSED_DEAL_STAGES } from '../crm.deal-closed';
import { CrmEmailMessageModel } from '../../gmail/gmail.models';
import { notFound } from '../../../utils/errors';
import { withId } from '../../../utils/serialize';
import { logger } from '../../../utils/logger';
import type { GraphQLContext } from '../../../middleware/auth';
import { scoreFromFacts, type DealFacts } from './deal-score.signals';

/**
 * Gathers what the deal score reads — the deal's activities and its contact's and company's,
 * how long it has sat in its stage and how the contact engages by email — scores it, and stores
 * the score with its reasons on the deal, so lists sort and filter on it without recomputing.
 */

const DAY_MS = 86_400_000;
const MONTH_MS = 30 * DAY_MS;

type LeanDeal = DealDocument & { _id: unknown; createdAt: Date };

const daysBetween = (from: Date, to: Date) =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY_MS));

/** Every address the deal's contact can be reached at. */
async function contactAddresses(contactId: string): Promise<string[]> {
  if (!isValidObjectId(contactId)) {
    return [];
  }
  const contact = await ContactModel.findById(contactId).select('email emails').lean();
  if (!contact) {
    return [];
  }
  const extra = (contact as { emails?: { address: string }[] }).emails ?? [];
  return [...new Set([contact.email, ...extra.map((e) => e.address)].filter(Boolean))];
}

async function activityFacts(deal: LeanDeal, now: Date) {
  const related = [String(deal._id), deal.contactId, deal.companyId].filter(Boolean);
  const scope = { relatedId: { $in: related } };
  const [latest, recent, overdueTasks] = await Promise.all([
    ActivityModel.findOne(scope).sort({ createdAt: -1 }).select('createdAt').lean(),
    ActivityModel.countDocuments({
      ...scope,
      createdAt: { $gte: new Date(now.getTime() - MONTH_MS) },
    }),
    ActivityModel.countDocuments({ ...scope, done: false, dueDate: { $lt: now } }),
  ]);
  return {
    daysSinceActivity: latest ? daysBetween(latest.createdAt, now) : null,
    activitiesLast30Days: recent,
    overdueTasks,
  };
}

async function emailFacts(contactId: string, now: Date) {
  const addresses = await contactAddresses(contactId);
  if (addresses.length === 0) {
    return { emailsInLast30Days: 0, emailsOutLast30Days: 0 };
  }
  const window = {
    participants: { $in: addresses },
    sentAt: { $gte: new Date(now.getTime() - MONTH_MS) },
  };
  const [inbound, outbound] = await Promise.all([
    CrmEmailMessageModel.countDocuments({ ...window, direction: 'IN' }),
    CrmEmailMessageModel.countDocuments({ ...window, direction: 'OUT' }),
  ]);
  return { emailsInLast30Days: inbound, emailsOutLast30Days: outbound };
}

export async function dealFacts(deal: LeanDeal, now = new Date()): Promise<DealFacts> {
  const [activity, email] = await Promise.all([
    activityFacts(deal, now),
    emailFacts(deal.contactId, now),
  ]);
  return {
    stage: deal.stage,
    // A deal that has not changed stage since stageEnteredAt existed has been in it since it was made.
    daysInStage: daysBetween(deal.stageEnteredAt ?? deal.createdAt, now),
    closeDatePassed: Boolean(deal.expectedCloseDate && deal.expectedCloseDate < now),
    ...activity,
    ...email,
  };
}

/** Scores one deal and stores the result. Returns the deal as the API reads it. */
async function persistScore(deal: LeanDeal, now: Date) {
  const { score, reasons } = scoreFromFacts(await dealFacts(deal, now));
  const saved = await DealModel.findByIdAndUpdate(
    deal._id,
    { $set: { score, scoreReasons: reasons, scoredAt: now } },
    { new: true },
  ).lean();
  if (!saved) notFound('Deal');
  return withId(saved);
}

export async function scoreDeal(id: string, now = new Date()) {
  if (!isValidObjectId(id)) notFound('Deal');
  const deal = await DealModel.findById(id).lean<LeanDeal | null>();
  if (!deal) notFound('Deal');
  return persistScore(deal, now);
}

/**
 * Rescores every open deal of the company in scope, one after another so a big pipeline does
 * not fan out hundreds of queries at once. Returns how many were scored.
 */
export async function scoreOpenDeals(now = new Date()): Promise<number> {
  const deals = await DealModel.find({ stage: { $nin: [...CLOSED_DEAL_STAGES] } }).lean<
    LeanDeal[]
  >();
  for (const deal of deals) {
    await persistScore(deal, now);
  }
  return deals.length;
}

/** Rescores the open deals of these contacts, after something new was logged on them. */
export async function scoreDealsOfContacts(contactIds: string[]): Promise<void> {
  const deals = await DealModel.find({
    contactId: { $in: contactIds },
    stage: { $nin: [...CLOSED_DEAL_STAGES] },
  }).lean<LeanDeal[]>();
  const now = new Date();
  for (const deal of deals) {
    await persistScore(deal, now);
  }
}

/**
 * Wraps a deal create or update so the saved deal is rescored straight after — a deal moved to
 * Proposal should not show its Qualifying score until the next scheduled pass. The rescore runs
 * after the answer: the save is what the person is waiting for. The wrapped resolver keeps its
 * own argument types.
 */
export const rescoredAfter =
  <A>(save: (p: unknown, args: A, ctx: GraphQLContext) => unknown) =>
  async (p: unknown, args: A, ctx: GraphQLContext) => {
    const row = (await save(p, args, ctx)) as { id: string };
    scoreDeal(row.id).catch((error: unknown) =>
      logger.error({ err: error }, `Deal ${row.id} could not be rescored`),
    );
    return row;
  };
