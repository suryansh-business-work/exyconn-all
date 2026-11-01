import { KbArticleModel } from './kb-article.model';
import { CannedReplyModel } from './canned-reply.model';
import { SupportReplyModel } from './support-reply.model';
import type { TicketScope } from './desk';
import { runAssist } from '../ai/ai.actions';
import type { AiActor } from '../ai/ai.service';
import { logger } from '../../utils/logger';

/**
 * The AI suggested reply: a draft written from the ticket's own conversation and the desk's
 * written answers — the published knowledge base and the canned replies. It runs through the
 * AI module's assist path, so it counts against the AI budget and lands in AI history.
 */

/** How much of each source the prompt carries, so one long ticket cannot spend the budget. */
const LIMITS = {
  articles: 3,
  articleChars: 1500,
  canned: 8,
  cannedChars: 600,
  replies: 6,
  replyChars: 800,
  descriptionChars: 2000,
  searchChars: 300,
} as const;

export interface SuggestTicket {
  _id: unknown;
  subject: string;
  description: string;
  category: string;
  requesterName?: string | null;
}

/** Published articles that match the ticket, best first. Empty when nothing matches. */
async function matchingArticles(ticket: SuggestTicket) {
  const phrase = `${ticket.subject} ${ticket.description.slice(0, LIMITS.searchChars)}`.trim();
  // The text index is built in the background on first use; wait for it once per boot.
  await KbArticleModel.init();
  try {
    return await KbArticleModel.find(
      { isPublished: true, $text: { $search: phrase } },
      { score: { $meta: 'textScore' }, title: 1, slug: 1, summary: 1, body: 1 },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(LIMITS.articles)
      .lean();
  } catch (error) {
    // A search failure must not cost the agent the draft: it is written without articles.
    logger.warn({ err: error }, 'Knowledge-base search for a suggested reply failed');
    return [];
  }
}

const cannedFor = (ticket: SuggestTicket, scope: TicketScope) =>
  CannedReplyModel.find({ isActive: true, category: ticket.category, ...scope })
    .select('title body')
    .sort({ title: 1 })
    .limit(LIMITS.canned)
    .lean();

/** The public conversation so far, oldest first. Internal notes stay out of a customer reply. */
async function conversation(ticketId: string): Promise<string> {
  const replies = await SupportReplyModel.find({ ticketId, internal: false })
    .sort({ createdAt: -1 })
    .limit(LIMITS.replies)
    .select('authorName body')
    .lean();
  return replies
    .reverse()
    .map((reply) => `${reply.authorName}: ${reply.body.slice(0, LIMITS.replyChars)}`)
    .join('\n\n');
}

function buildPrompt(
  ticket: SuggestTicket,
  thread: string,
  articles: Awaited<ReturnType<typeof matchingArticles>>,
  canned: Awaited<ReturnType<typeof cannedFor>>,
): string {
  const articleText = articles
    .map((a) => `## ${a.title}\n${a.summary ?? ''}\n${a.body.slice(0, LIMITS.articleChars)}`)
    .join('\n\n');
  const cannedText = canned
    .map((c) => `## ${c.title}\n${c.body.slice(0, LIMITS.cannedChars)}`)
    .join('\n\n');
  return [
    'You are a support agent. Write the next reply to the customer on this ticket.',
    'Use ONLY facts from the knowledge-base articles and canned replies below. If they do not',
    'answer the question, say what you will check and ask for any detail you need. Be polite and',
    'direct. Plain text, no subject line, no placeholders, no sign-off name.',
    '',
    `Ticket: ${ticket.subject}`,
    `From: ${ticket.requesterName || 'the requester'}`,
    ticket.description.slice(0, LIMITS.descriptionChars),
    '',
    `Conversation so far:\n${thread || '(no replies yet)'}`,
    '',
    `Knowledge-base articles:\n${articleText || '(none matched)'}`,
    '',
    `Canned replies:\n${cannedText || '(none)'}`,
  ].join('\n');
}

export async function suggestSupportReply(
  ticket: SuggestTicket,
  scope: TicketScope,
  actor: AiActor,
) {
  const [articles, canned, thread] = await Promise.all([
    matchingArticles(ticket),
    cannedFor(ticket, scope),
    conversation(String(ticket._id)),
  ]);
  const body = await runAssist(
    'Support suggested reply',
    buildPrompt(ticket, thread, articles, canned),
    actor,
  );
  return {
    body: body.trim(),
    articles: articles.map((a) => ({ id: String(a._id), title: a.title, slug: a.slug })),
    cannedReplies: canned.map((c) => c.title),
  };
}
