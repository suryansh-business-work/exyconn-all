import { createHash, randomBytes } from 'node:crypto';
import type { FilterQuery } from 'mongoose';
import { SupportTicketModel, type SupportTicketDocument } from '../employee/support.model';
import { emailer } from '../email';
import { env } from '../../config/env';
import { runAsPlatform } from '../../lib/tenant';
import { createLimiter } from '../../lib/rateLimiter';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Customer satisfaction (CSAT): one short survey per customer ticket, emailed the first time
 * the ticket is resolved, answered on the public status site without an account. The link's
 * token is the only credential, so only its hash is stored and it works for one answer.
 */

/** Seeded by ensureEmailDefaults and edited in Tech > Email. */
export const SUPPORT_CSAT_TEMPLATE = 'support-csat';
/** Ratings of 4 and 5 count as satisfied, the usual CSAT convention. */
const SATISFIED_FROM = 4;
const COMMENT_MAX = 1000;

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/** Opening a link and answering it are cheap for a person and the whole game for a script. */
const csatLimiter = createLimiter({ keyPrefix: 'support_csat_ip', points: 30, durationSec: 3600 });

interface ResolvedTicket {
  _id: unknown;
  requesterType?: string | null;
  requesterName?: string | null;
  requesterEmail?: string | null;
  reference?: string | null;
  subject: string;
  csatSentAt?: Date | null;
}

/**
 * Emails the survey for a ticket that has just been resolved, once per ticket. Only a customer
 * with an address is asked: an employee is not the desk's customer, and a WhatsApp requester has
 * no address. Best-effort — the status change already stands, so a mail failure is logged.
 */
export async function sendCsatSurvey(ticket: ResolvedTicket): Promise<void> {
  const to = ticket.requesterEmail ?? '';
  if (ticket.requesterType !== 'CLIENT' || !to || ticket.csatSentAt) {
    return;
  }
  const token = randomBytes(32).toString('base64url');
  // Claimed atomically, so two resolves racing each other send one survey between them.
  const claimed = await SupportTicketModel.updateOne(
    { _id: ticket._id, csatSentAt: null },
    { $set: { csatSentAt: new Date(), csatTokenHash: hashToken(token) } },
  );
  if (claimed.modifiedCount === 0) {
    return;
  }
  try {
    await emailer.send({
      template: SUPPORT_CSAT_TEMPLATE,
      to,
      variables: {
        name: ticket.requesterName || to,
        ticketSubject: ticket.subject,
        reference: ticket.reference ?? '',
        ratingUrl: `${env.supportCsatUrl}/${token}`,
      },
      triggeredBy: 'support ticket resolved',
    });
  } catch (error) {
    logger.error({ err: error }, `CSAT survey for ticket ${String(ticket._id)} failed`);
  }
}

async function assertAllowed(ip?: string): Promise<void> {
  if (ip !== undefined && !(await csatLimiter.allow(ip))) {
    badRequest('Too many attempts from this connection. Try again in an hour.');
  }
}

/** The ticket a survey link belongs to. Read as the platform: the customer has no company scope. */
const ticketForToken = (token: string) =>
  runAsPlatform(() =>
    SupportTicketModel.findOne({ csatTokenHash: hashToken(token.trim()) })
      .select('reference subject csatScore csatRatedAt')
      .lean(),
  );

/** What the rating page shows. Null for a link that is unknown — never which part was wrong. */
export async function supportCsatSurvey(token: string, ip?: string) {
  await assertAllowed(ip);
  const ticket = await ticketForToken(token);
  if (!ticket) {
    return null;
  }
  return {
    reference: ticket.reference,
    subject: ticket.subject,
    score: ticket.csatScore ?? null,
    ratedAt: ticket.csatRatedAt ?? null,
  };
}

/** Records the answer. One answer per survey: a second submit is refused rather than overwritten. */
export async function submitSupportCsat(
  token: string,
  score: number,
  comment: string,
  ip?: string,
): Promise<boolean> {
  await assertAllowed(ip);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    badRequest('Choose a rating from 1 to 5.');
  }
  const text = comment.trim();
  if (text.length > COMMENT_MAX) {
    badRequest(`Keep the comment under ${COMMENT_MAX} characters.`);
  }
  const saved = await runAsPlatform(() =>
    SupportTicketModel.updateOne(
      { csatTokenHash: hashToken(token.trim()), csatRatedAt: null },
      { $set: { csatScore: score, csatComment: text, csatRatedAt: new Date() } },
    ),
  );
  if (saved.modifiedCount === 0) {
    badRequest('This survey link does not work, or it has already been answered.');
  }
  return true;
}

export interface CsatSummary {
  csatSent: number;
  csatResponses: number;
  csatAverage: number | null;
  csatPercent: number | null;
}

/** How satisfied customers are, over every answer in the caller's desk scope. */
export async function csatSummary(
  scope: FilterQuery<SupportTicketDocument> = {},
): Promise<CsatSummary> {
  const [sent, answers] = await Promise.all([
    SupportTicketModel.countDocuments({ ...scope, csatSentAt: { $ne: null } }),
    SupportTicketModel.aggregate<{ count: number; average: number; satisfied: number }>([
      { $match: { ...scope, csatScore: { $ne: null } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          average: { $avg: '$csatScore' },
          satisfied: { $sum: { $cond: [{ $gte: ['$csatScore', SATISFIED_FROM] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const row = answers[0];
  if (!row || row.count === 0) {
    return { csatSent: sent, csatResponses: 0, csatAverage: null, csatPercent: null };
  }
  return {
    csatSent: sent,
    csatResponses: row.count,
    csatAverage: Math.round(row.average * 100) / 100,
    csatPercent: Math.round((row.satisfied / row.count) * 1000) / 10,
  };
}
