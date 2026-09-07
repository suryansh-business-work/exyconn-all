import { ClientModel } from '../clients/clients.model';
import { SupportTicketModel } from '../employee/support.model';
import { SupportReplyModel } from './support-reply.model';
import { dueAtForPriority } from './sla.service';
import { uniqueReference } from './ticket-reference';
import { badRequest } from '../../utils/errors';
import { withIds } from '../../utils/serialize';
import { logger } from '../../utils/logger';
import { createRateLimiter } from '../../utils/rateLimit';

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
const HOUR_MS = 60 * 60 * 1000;
const ticketLimiter = createRateLimiter(HOUR_MS, 5);

/** Test seam: forgets every recorded attempt. */
export function resetClientTicketLimits(): void {
  ticketLimiter.reset();
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
  if (!EMAIL_PATTERN.exec(input.requesterEmail)) {
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
  const sameDomain = await ClientModel.findOne({ email: { $regex: `@${domain}$`, $options: 'i' } })
    .select('name')
    .lean();
  return sameDomain ? { id: sameDomain._id.toString(), name: sameDomain.name } : null;
}

/**
 * Files a ticket raised from the public customer form and hands back only its reference.
 *
 * Unauthenticated by design, so nothing about the requester is trusted: the address is
 * matched against the client book rather than taken as an account, and the reference is
 * all the caller learns — it can never be used to read somebody else's ticket without
 * the matching address.
 */
export async function createClientSupportTicket(raw: ClientSupportTicketInput): Promise<string> {
  const input = normalize(raw);
  assertValid(input);
  if (!ticketLimiter.allow(input.requesterEmail)) {
    badRequest('Too many tickets from this address. Try again in an hour.');
  }

  const client = await resolveClient(input.requesterEmail);
  const createdAt = new Date();
  const ticket = await SupportTicketModel.create({
    ...input,
    requesterType: 'CLIENT',
    reference: await uniqueReference(),
    clientId: client?.id ?? '',
    clientName: client?.name ?? '',
    status: 'OPEN',
    dueAt: await dueAtForPriority(input.priority, createdAt),
  });
  logger.info(`Support ticket ${ticket.reference} raised by ${input.requesterEmail}`);
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
): Promise<ClientTicketStatus | null> {
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
