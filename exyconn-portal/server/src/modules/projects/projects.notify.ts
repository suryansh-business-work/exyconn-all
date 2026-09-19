import { notifyBestEffort } from '../notifications/notifications.service';
import type { Actor } from './board.service';

/**
 * Telling people what happened to their tickets.
 *
 * A board that never speaks is a board people have to remember to open, and the work that
 * gets forgotten is always somebody else's edit to your ticket. Three events are worth a
 * notice and no more: a ticket handed to you, a comment on a ticket you are carrying or
 * raised, and somebody else calling your ticket finished. Everything else — a reorder, a
 * label, a story point — is noise, and a bell that rings for noise is a bell people mute.
 *
 * Every notice here is best-effort. The action that triggered it has already happened by
 * the time we get here, so a notification store that is down must cost the reader a notice,
 * never cost the team the edit. `notifyBestEffort` is what enforces that; nothing in this
 * file may throw past it.
 */

/** Project notices all share one kind, so the bell can be filtered down to delivery work. */
const KIND = 'PROJECT';

/**
 * The ticket fields a notice is written from.
 *
 * Deliberately narrower than a Task document so both a hydrated document and a `.lean()`
 * row satisfy it, and so a caller can see at a glance which fields it must have selected.
 */
export interface NotifiableTask {
  key: string;
  title: string;
  /** An ObjectId on a document, a string on a lean row — stringified either way. */
  projectId: unknown;
  assigneeId?: string | null;
  reporterId?: string | null;
}

/** Where the reader lands. There is no per-ticket route yet, so the board is the answer. */
function boardLink(task: NotifiableTask): string {
  return `/projects/${String(task.projectId)}/board`;
}

/**
 * Who has a stake in a ticket, minus whoever is acting.
 *
 * Acting on your own ticket must never notify you: a notice for something you just did is
 * the fastest way to teach somebody that the bell is not worth reading. The set also
 * collapses the common case where the assignee raised the ticket themselves.
 */
function watchersOf(task: NotifiableTask, actorId: string): string[] {
  const watchers = new Set([task.assigneeId ?? '', task.reporterId ?? '']);
  watchers.delete('');
  watchers.delete(actorId);
  return [...watchers];
}

/** Delivers one notice to each recipient, swallowing and logging any delivery failure. */
async function tell(
  recipients: string[],
  payload: { title: string; body: string; link: string },
): Promise<void> {
  for (const employeeId of recipients) {
    await notifyBestEffort(employeeId, { kind: KIND, ...payload });
  }
}

/**
 * "This is yours now."
 *
 * `previousAssigneeId` is what stops a re-save of an unrelated field from re-announcing an
 * assignment the reader was told about days ago: only a change of hands is news.
 */
export async function notifyAssignment(
  task: NotifiableTask,
  actor: Actor,
  previousAssigneeId = '',
): Promise<void> {
  const assigneeId = task.assigneeId ?? '';
  if (assigneeId === '' || assigneeId === previousAssigneeId || assigneeId === actor.id) {
    return;
  }
  await tell([assigneeId], {
    title: `${task.key} is yours`,
    body: `${actor.name} assigned "${task.title}" to you.`,
    link: boardLink(task),
  });
}

/** A comment reaches whoever is carrying the ticket and whoever raised it. */
export async function notifyComment(task: NotifiableTask, author: Actor): Promise<void> {
  await tell(watchersOf(task, author.id), {
    title: `New comment on ${task.key}`,
    body: `${author.name} commented on "${task.title}".`,
    link: boardLink(task),
  });
}

/**
 * Somebody else called your ticket finished.
 *
 * Worth a notice precisely because the person who moved it is not the person who has to
 * live with it being wrong — which is why an assignee moving their own card says nothing.
 */
export async function notifyTicketDone(
  task: NotifiableTask,
  actor: Actor,
  columnName: string,
): Promise<void> {
  await tell(watchersOf(task, actor.id), {
    title: `${task.key} was moved to ${columnName}`,
    body: `${actor.name} moved "${task.title}" to ${columnName}.`,
    link: boardLink(task),
  });
}
