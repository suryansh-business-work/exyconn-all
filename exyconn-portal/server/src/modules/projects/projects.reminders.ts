import { BoardColumnModel, TaskModel } from './board.model';
import { BugModel } from '../bugs/bugs.model';
import { registerReminderSource, dayKey, daysUntil, dueInWords } from '../reminders';
import type { Reminder } from '../reminders';

/** How many cards the notice names before it stops listing and starts counting. */
const NAMED = 3;

/** A bug in either of these is still somebody's problem; the other two are done with. */
const OPEN_BUG_STATUSES = ['OPEN', 'IN_PROGRESS'];

/** One thing somebody was supposed to have finished by now. */
interface DueItem {
  assigneeId: string;
  /** How the notice names it — a ticket key and summary, or a bug's title. */
  label: string;
  dueDate: Date;
}

/**
 * The last instant of `now`'s day.
 *
 * A card due today is due, not upcoming: chasing only what is already past would mean the
 * first notice about today's deadline arrives tomorrow morning, which is too late to be a
 * reminder and only good enough to be a reproach.
 */
function endOfDay(now: Date): Date {
  return new Date(`${dayKey(now)}T23:59:59.999Z`);
}

/**
 * Tickets past their date, excluding anything already sitting in a done column.
 *
 * "Done" is read from the board rather than guessed, for the same reason the health page
 * reads it: a board's columns are whatever the team named them, and treating the last one
 * as finished would chase people about work they delivered a fortnight ago.
 */
async function dueTickets(now: Date): Promise<DueItem[]> {
  const doneColumns = await BoardColumnModel.find({ isDone: true }).select('_id').lean();
  const rows = await TaskModel.find({
    assigneeId: { $nin: ['', null] },
    dueDate: { $ne: null, $lte: endOfDay(now) },
    columnId: { $nin: doneColumns.map((column) => column._id) },
  })
    .select('key title assigneeId dueDate')
    .lean();
  return rows.map((row) => ({
    assigneeId: String(row.assigneeId),
    label: `${row.key} ${row.title}`,
    dueDate: row.dueDate as Date,
  }));
}

/** Bugs past their date that nobody has resolved or closed. */
async function dueBugs(now: Date): Promise<DueItem[]> {
  const rows = await BugModel.find({
    assigneeId: { $nin: ['', null] },
    status: { $in: OPEN_BUG_STATUSES },
    dueDate: { $lte: endOfDay(now) },
  })
    .select('title assigneeId dueDate')
    .lean();
  return rows.map((row) => ({
    assigneeId: String(row.assigneeId),
    label: row.title,
    dueDate: row.dueDate,
  }));
}

/** The due list per person, so each of them is written to once. */
function byAssignee(items: DueItem[]): Map<string, DueItem[]> {
  const grouped = new Map<string, DueItem[]>();
  for (const item of items) {
    const carried = grouped.get(item.assigneeId) ?? [];
    carried.push(item);
    grouped.set(item.assigneeId, carried);
  }
  return grouped;
}

/** One person's notice: the most overdue named first, the rest counted. */
function noticeFor(employeeId: string, items: DueItem[], now: Date): Reminder {
  // A copy, because the caller's grouped list is read again by nothing here but might be.
  const ordered = [...items].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const named = ordered
    .slice(0, NAMED)
    .map((item) => `${item.label} (${dueInWords(daysUntil(now, item.dueDate))})`)
    .join(', ');
  const rest = ordered.length - Math.min(ordered.length, NAMED);
  const tail = rest > 0 ? ` and ${rest} more` : '';

  return {
    dedupeKey: `projects-due:${employeeId}:${dayKey(now)}`,
    kind: 'PROJECT',
    title: `${ordered.length} thing${ordered.length === 1 ? '' : 's'} due`,
    body: `${named}${tail}. Close them out or move the dates.`,
    link: '/projects',
    employeeIds: [employeeId],
  };
}

/**
 * The delivery queue, as one notice a person a day rather than one per card.
 *
 * Tickets and bugs both carry a due date and until now nothing read either — a bug's date
 * is even mandatory, which made it a field people filled in for nobody. They are chased
 * together because they are the same obligation seen from two screens: a developer with
 * four late tickets and two late bugs is six things behind, not two separate problems.
 *
 * Summarised rather than itemised for the reason the CRM queue is: a busy sprint week can
 * leave one person twenty cards past their date, and twenty notifications every morning is
 * how a team learns to ignore the bell.
 */
registerReminderSource({
  key: 'projects-due',
  label: 'Tickets and bugs due',
  async due(now): Promise<Reminder[]> {
    const [tickets, bugs] = await Promise.all([dueTickets(now), dueBugs(now)]);
    const grouped = byAssignee([...tickets, ...bugs]);
    return [...grouped].map(([employeeId, items]) => noticeFor(employeeId, items, now));
  },
});
