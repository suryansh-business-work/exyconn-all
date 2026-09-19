import { ClientModel } from '../clients/clients.model';
import { SupportTicketModel, type TicketChannel } from '../employee/support.model';
import { SupportReplyModel } from './support-reply.model';
import type { Attachment } from './attachment.schema';
import { dueAtForPriority } from './sla.service';
import { uniqueReference } from './ticket-reference';
import { announceTicketFiled } from './ticket-events';
import { badRequest } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import { logger } from '../../utils/logger';
import { createLimiter } from '../../lib/rateLimiter';
import { MAX_EMAIL_LENGTH } from '../../lib/rateLimiterSignIn';

/** What the public form sends. Every field is re-validated here — the client is untrusted. */
export interface ClientSupportTicketInput {
  requesterName: string;
  requesterEmail: string;
  subject: string;
  category: string;
  description: string;
  priority: string;
}

/** Mirrors the Zod schema the public form uses, so both surfaces reject the same things. */
const LIMITS = {
  name: { min: 2, max: 80 },
  subject: { min: 5, max: 120 },
  description: { min: 20, max: 4000 },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Five tickets an hour from one address is a person with a problem; more is a script. */
const HOUR_SEC = 60 * 60;
const ticketLimiter = createLimiter({
  keyPrefix: 'ticket_address',
  points: 5,
  durationSec: HOUR_SEC,
});
/** Per-IP as well, so one machine cannot file five tickets under each of a thousand addresses. */
const ticketIpLimiter = createLimiter({
  keyPrefix: 'ticket_ip',
  points: 20,
  durationSec: HOUR_SEC,
});
/**
 * Following a ticket is cheap, and a customer does it a handful of times a day; a script
 * pairing guessed references with guessed addresses does it thousands of times. Ten an hour
 * per connection is generous for the first and useless for the second, and it is its own
 * bucket so checking on a ticket never spends somebody's ability to raise one.
 */
const ticketLookupLimiter = createLimiter({
  keyPrefix: 'ticket_lookup_ip',
  points: 10,
  durationSec: HOUR_SEC,
});

/** Test seam: forgets every recorded attempt. */
export async function resetClientTicketLimits(): Promise<void> {
  await Promise.all([ticketLimiter.reset(), ticketIpLimiter.reset(), ticketLookupLimiter.reset()]);
}

/** Regex metacharacters in a value that is matched literally. */
function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function assertLength(value: string, label: string, { min, max }: { min: number; max: number }) {
  if (value.length < min) {
    badRequest(`${label} must be at least ${min} characters`);
  }
  if (value.length > max) {
    badRequest(`${label} must be at most ${max} characters`);
  }
}

/** Trims the free text once, so what is validated and what is stored are the same string. */
function normalize(input: ClientSupportTicketInput): ClientSupportTicketInput {
  return {
    requesterName: input.requesterName.trim(),
    requesterEmail: input.requesterEmail.trim().toLowerCase(),
    subject: input.subject.trim(),
    category: input.category,
    description: input.description.trim(),
    priority: input.priority,
  };
}

function assertValid(input: ClientSupportTicketInput): void {
  assertLength(input.requesterName, 'Name', LIMITS.name);
  assertLength(input.subject, 'Subject', LIMITS.subject);
  assertLength(input.description, 'Description', LIMITS.description);
  if (input.requesterEmail.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.exec(input.requesterEmail)) {
    badRequest('Enter a valid email address');
  }
}

/**
 * Which client, if any, the address belongs to: the exact address first, then anyone at
 * the same company domain. Unknown is a perfectly normal answer — a prospect writing in
 * still gets a ticket, it is simply not attributed to an account.
 */
async function resolveClient(email: string): Promise<{ id: string; name: string } | null> {
  const exact = await ClientModel.findOne({ email }).select('name').lean();
  if (exact) {
    return { id: exact._id.toString(), name: exact.name };
  }
  const domain = email.split('@')[1] ?? '';
  if (!domain) {
    return null;
  }
  // Escaped: the domain is caller-supplied, and "a@.*" must not match every client on file.
  const pattern = `@${escapeRegex(domain)}$`;
  const sameDomain = await ClientModel.findOne({ email: { $regex: pattern, $options: 'i' } })
    .select('name')
    .lean();
  return sameDomain ? { id: sameDomain._id.toString(), name: sameDomain.name } : null;
}

/**
 * Files a customer ticket: the client book is searched for the address, a reference is
 * minted and the SLA clock is started.
 *
 * Every route a customer ticket can arrive by goes through here — the public form, an
 * agent raising one in the console, a mail landing in the support mailbox — so a ticket
 * is attributed, referenced and measured the same way whichever door it came in at. What
 * differs per route (validating a web form, rate-limiting the internet) stays outside it.
 */
export async function fileClientTicket(
  input: ClientSupportTicketInput,
  channel: TicketChannel,
  attachments: Attachment[] = [],
) {
  const client = await resolveClient(input.requesterEmail);
  const createdAt = new Date();
  const ticket = await SupportTicketModel.create({
    ...input,
    requesterType: 'CLIENT',
    channel,
    reference: await uniqueReference(),
    clientId: client?.id ?? '',
    clientName: client?.name ?? '',
    status: 'OPEN',
    attachments,
    dueAt: await dueAtForPriority(input.priority, createdAt),
  });
  logger.info(`Support ticket ${ticket.reference} raised by ${input.requesterEmail} (${channel})`);
  announceTicketFiled(ticket);
  return ticket;
}

/**
 * Files a ticket raised from the public customer form and hands back only its reference.
 *
 * Unauthenticated by design, so nothing about the requester is trusted: the address is
 * matched against the client book rather than taken as an account, and the reference is
 * all the caller learns — it can never be used to read somebody else's ticket without
 * the matching address.
 */
export async function createClientSupportTicket(
  raw: ClientSupportTicketInput,
  channel: TicketChannel = 'PORTAL',
  /** The caller's address. Absent for an internal caller, which is not limited per IP. */
  ip?: string,
): Promise<string> {
  const input = normalize(raw);
  assertValid(input);
  if (ip !== undefined && !(await ticketIpLimiter.allow(ip))) {
    badRequest('Too many tickets from this connection. Try again in an hour.');
  }
  if (!(await ticketLimiter.allow(input.requesterEmail))) {
    badRequest('Too many tickets from this address. Try again in an hour.');
  }

  const ticket = await fileClientTicket(input, channel);
  return ticket.reference;
}

/** Only what the public status lookup needs off a ticket. */
interface TicketRecord {
  _id: { toString(): string };
  reference: string;
  subject: string;
  status: string;
  updatedAt: Date;
}

export interface ClientTicketStatus {
  reference: string;
  subject: string;
  status: string;
  updatedAt: Date;
  replies: unknown[];
}

/**
 * Lets a customer follow their own ticket with the reference they were given and the
 * address they raised it from. Both must match: the reference alone is quotable in an
 * email thread, so it is a handle, not a credential. A mismatch reads as "no such
 * ticket" rather than "wrong address", which would confirm the reference exists.
 */
export async function clientSupportTicketStatus(
  reference: string,
  email: string,
  /** The caller's address. Absent for an internal caller, which is not limited. */
  ip?: string,
): Promise<ClientTicketStatus | null> {
  if (ip !== undefined && !(await ticketLookupLimiter.allow(ip))) {
    badRequest('Too many lookups from this connection. Try again in an hour.');
  }
  const ticket = await SupportTicketModel.findOne({
    reference: reference.trim().toUpperCase(),
    requesterEmail: email.trim().toLowerCase(),
    requesterType: 'CLIENT',
  }).lean<TicketRecord | null>();
  if (!ticket) {
    return null;
  }
  const replies = await SupportReplyModel.find({
    ticketId: ticket._id.toString(),
    internal: false,
  })
    .sort({ createdAt: 1 })
    .lean();
  return {
    reference: ticket.reference,
    subject: ticket.subject,
    status: ticket.status,
    updatedAt: ticket.updatedAt,
    replies: withIds(replies),
  };
}
