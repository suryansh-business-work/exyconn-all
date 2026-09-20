import { SupportTicketModel } from '../employee/support.model';
import { registerReminderSource, dayKey } from '../reminders';
import type { Reminder } from '../reminders';
import { ROLES } from '../../constants/roles';
import { logger } from '../../utils/logger';
import { minutesBetween, slaState } from './support.sla';
import { applyEscalation, ticketLink } from './escalation';

/**
 * What the sweep reads off a ticket. Deliberately the smallest set that answers "is this
 * about to break its promise, and who should hear about it" — the whole open queue is read
 * row by row every hour, so nothing else belongs in the projection.
 */
interface WatchedTicket {
  _id: unknown;
  subject: string;
  category: string;
  createdAt: Date;
  dueAt: Date;
  assigneeId?: string | null;
  escalationLevel?: number | null;
}

/**
 * Who an automatic escalation is signed by on the thread.
 *
 * A sentinel id rather than an account, the way an emailed reply is authored by
 * `inbound-mail`: no account did this, and the note has to read as the system acting on a
 * deadline rather than as an agent who never touched the ticket.
 */
const SLA_ACTOR = { id: 'sla-monitor', name: 'SLA monitor' };

const ESCALATION_REASON =
  'The resolution deadline passed with the ticket still unresolved, so the SLA escalated it automatically.';

const MINUTES_PER_HOUR = 60;

/** A span of minutes as the shortest phrase that still reads exactly: "45 min", "3h 10m". */
function asSpan(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** Unresolved tickets that carry a deadline — the only ones a promise can be measured on. */
async function watchedTickets(): Promise<WatchedTicket[]> {
  return SupportTicketModel.find({ resolvedAt: null, dueAt: { $ne: null } })
    .select('subject category createdAt dueAt assigneeId escalationLevel')
    .lean<WatchedTicket[]>();
}

/**
 * Who hears about one ticket: whoever holds it, or the whole desk when nobody does.
 *
 * An unassigned ticket breaching is the case that most needs saying out loud, and there is
 * no individual to say it to — SUPPORT rather than IT even for an IT ticket, because the
 * support desk is the role that sees the whole queue and owns the promise made on it.
 */
function audience(ticket: WatchedTicket): Pick<Reminder, 'employeeIds' | 'roles'> {
  if (ticket.assigneeId) {
    return { employeeIds: [ticket.assigneeId] };
  }
  return { roles: [ROLES.SUPPORT] };
}

/** "You have a few hours left" — sent once a day per ticket, in the last quarter of its window. */
function dueSoonReminder(ticket: WatchedTicket, now: Date): Reminder {
  const left = asSpan(minutesBetween(now, ticket.dueAt));
  return {
    dedupeKey: `support-sla-due:${String(ticket._id)}:${dayKey(now)}`,
    kind: 'SUPPORT',
    title: `SLA due in ${left}: ${ticket.subject}`,
    body: `This ticket has ${left} left before it breaches its resolution promise. Resolve it, or escalate it now rather than after the deadline.`,
    link: ticketLink(String(ticket._id), ticket.category),
    ...audience(ticket),
  };
}

/** "This one is already late" — also once a day, so a stale ticket is not forgotten quietly. */
function breachedReminder(ticket: WatchedTicket, now: Date): Reminder {
  const late = asSpan(minutesBetween(ticket.dueAt, now));
  return {
    dedupeKey: `support-sla-breach:${String(ticket._id)}:${dayKey(now)}`,
    kind: 'SUPPORT',
    title: `SLA breached by ${late}: ${ticket.subject}`,
    body: `The resolution deadline passed ${late} ago and the ticket is still open. It has been escalated automatically; resolve it or tell the customer where it stands.`,
    link: ticketLink(String(ticket._id), ticket.category),
    ...audience(ticket),
  };
}

/**
 * Raises every breached ticket that has never been raised before.
 *
 * `escalationLevel` is the guard, not the reminder log: the log forgets nothing but is keyed
 * by day, so it would let the sweep escalate the same ticket again tomorrow — level 3 by
 * Thursday on a ticket nobody ever looked at, which says nothing and costs the escalation
 * level its meaning. Anything already at level 1 or above has been raised, by a person or by
 * an earlier sweep, and is left alone.
 *
 * One failure does not stop the rest: a ticket whose escalation throws is logged and the
 * queue keeps moving, because the reminders that follow are the part a human still sees.
 */
async function escalateBreached(breached: WatchedTicket[]): Promise<void> {
  for (const ticket of breached) {
    if ((ticket.escalationLevel ?? 0) > 0) {
      continue;
    }
    try {
      await applyEscalation(ticket, ESCALATION_REASON, SLA_ACTOR);
    } catch (error) {
      logger.error(error, `Automatic escalation of ticket ${String(ticket._id)} failed`);
    }
  }
}

/**
 * Makes the SLA act instead of only reporting.
 *
 * Until now `DUE_SOON` and `BREACHED` were computed when somebody opened the console, which
 * means a promise was only broken in front of whoever happened to look. The sweep is the one
 * thing that revisits a ticket after its deadline, so both halves hang off it: the warning
 * while there is still time to act, and the escalation the moment there is not.
 *
 * The escalation runs inside `due` rather than beside it because it must happen whether or
 * not anybody is notified — an unassigned breached ticket with no support role on file still
 * has to be raised and still has to say so on its own thread.
 */
registerReminderSource({
  key: 'support-sla',
  label: 'Support tickets against their SLA',
  async due(now): Promise<Reminder[]> {
    const dueSoon: WatchedTicket[] = [];
    const breached: WatchedTicket[] = [];
    for (const ticket of await watchedTickets()) {
      const state = slaState(ticket, now);
      if (state === 'DUE_SOON') {
        dueSoon.push(ticket);
      } else if (state === 'BREACHED') {
        breached.push(ticket);
      }
    }
    await escalateBreached(breached);
    return [
      ...dueSoon.map((ticket) => dueSoonReminder(ticket, now)),
      ...breached.map((ticket) => breachedReminder(ticket, now)),
    ];
  },
});
