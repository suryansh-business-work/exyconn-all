import { subDays } from 'date-fns';
import { stats as botStats } from '../../../../../demos/whatsapp-demo/server/src/whatsappDemo.stats';
import { WhatsappDemoVisitorModel } from '../../../../../demos/whatsapp-demo/server/src/visitor/visitor.model';
import { CallingBotCallModel } from '../calling-bot-demo/calling-bot.models';
import { ChatMessageModel, ChatSessionModel } from '../website-chat/models';

/** How far back the overview looks when the console does not say, and the most it may. */
export const DEFAULT_OVERVIEW_DAYS = 30;
const MAX_OVERVIEW_DAYS = 365;

/** A day count the console may ask for: a whole number from 1 to a year. */
export function overviewDays(days?: number | null): number {
  if (!days || !Number.isFinite(days)) {
    return DEFAULT_OVERVIEW_DAYS;
  }
  return Math.min(MAX_OVERVIEW_DAYS, Math.max(1, Math.trunc(days)));
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** Share of `part` in `whole`, 0 when there is no whole. */
const share = (part: number, whole: number) => (whole > 0 ? Math.min(1, part / whole) : 0);

/** The website's live chats in the range, and how many of them a person replied in. */
async function liveChats(since: Date) {
  const sessionIds = (
    await ChatSessionModel.find({ createdAt: { $gte: since } })
      .select('_id')
      .lean()
  ).map((row) => String(row._id));
  if (sessionIds.length === 0) {
    return { total: 0, answeredByPeople: 0 };
  }
  const answered = await ChatMessageModel.distinct('sessionId', {
    sessionId: { $in: sessionIds },
    sender: 'AGENT',
  });
  return { total: sessionIds.length, answeredByPeople: answered.length };
}

/** The calling bot's calls in the range, by how they went. */
async function calls(since: Date) {
  const [total, completed, failed] = await Promise.all([
    CallingBotCallModel.countDocuments({ createdAt: { $gte: since } }),
    CallingBotCallModel.countDocuments({ createdAt: { $gte: since }, status: 'ENDED' }),
    CallingBotCallModel.countDocuments({ createdAt: { $gte: since }, status: 'FAILED' }),
  ]);
  return { total, completed, failed };
}

/**
 * The Agents console's overview, read from what the agents already record: the bot studio's
 * sessions (both channels), the website's live chats, the calling bot's calls and the WhatsApp
 * demo's leads. Nothing is stored for it.
 */
export async function agentsOverview(days: number, now = new Date()) {
  const since = subDays(now, days - 1);
  since.setUTCHours(0, 0, 0, 0);
  const from = isoDate(since);
  const to = isoDate(now);
  const [whatsapp, website, chats, callCounts, leadsCaptured] = await Promise.all([
    botStats(from, to, 'whatsapp'),
    botStats(from, to, 'website'),
    liveChats(since),
    calls(since),
    WhatsappDemoVisitorModel.countDocuments({ createdAt: { $gte: since } }),
  ]);
  return {
    days,
    from,
    to,
    conversations: whatsapp.sessions + website.sessions + chats.total + callCounts.total,
    whatsappSessions: whatsapp.sessions,
    whatsappCompletionRate: whatsapp.completionRate,
    websiteAgentSessions: website.sessions,
    websiteChats: chats.total,
    websiteChatsAnsweredByPeople: chats.answeredByPeople,
    deflectionRate: chats.total > 0 ? 1 - share(chats.answeredByPeople, chats.total) : 0,
    calls: callCounts.total,
    callsCompleted: callCounts.completed,
    callsFailed: callCounts.failed,
    leadsCaptured,
  };
}
