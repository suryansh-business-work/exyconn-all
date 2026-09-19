import { ReminderLogModel } from './reminder-log.model';
import { UserModel } from '../admin/user.model';
import { deliver } from '../notifications/delivery';
import { logger } from '../../utils/logger';
import type { Role } from '../../constants/roles';

/** One thing worth chasing, as a source describes it. */
export interface Reminder {
  /** Unique per thing per window. Reuse it and the reminder is sent once. */
  dedupeKey: string;
  kind: string;
  title: string;
  body: string;
  /** Where in the portal the reader should land. */
  link: string;
  /** Employees to tell. Combined with `roles`; duplicates are collapsed. */
  employeeIds?: string[];
  /** Whole roles to tell — "every compliance officer", "the finance team". */
  roles?: Role[];
}

/** Active employees holding any of these roles. */
async function holdersOf(roles: Role[]): Promise<string[]> {
  if (roles.length === 0) {
    return [];
  }
  const users = await UserModel.find({ isActive: true, roles: { $in: roles } })
    .select('_id')
    .lean();
  return users.map((user) => String(user._id));
}

/**
 * Claims one dedupe key, and reports whether this caller is the one that got it.
 *
 * The claim is made FIRST and the chasing happens after: whoever inserts the row, sends.
 * Sending first and recording after would double-chase on any crash in between, and a
 * duplicate nag is the failure this whole mechanism exists to avoid. The unique index
 * behind it settles the case of two processes sweeping at once — the loser's upsert
 * reports no insert and it quietly does nothing.
 *
 * Exported because an in-app notification is not the only way a module chases: an overdue
 * invoice is chased by email to somebody who has no login at all, and that stage still has
 * to happen exactly once per invoice. It claims through here so there is one answer to
 * "has this already been sent", not one per delivery mechanism.
 */
export async function claimReminder(
  source: string,
  dedupeKey: string,
  recipients = 0,
): Promise<boolean> {
  const claim = await ReminderLogModel.updateOne(
    { dedupeKey },
    { $setOnInsert: { source, dedupeKey, recipients } },
    { upsert: true },
  );
  return Boolean(claim.upsertedCount);
}

/** Sends one reminder, at most once for its window. */
export async function sendReminder(source: string, reminder: Reminder): Promise<number> {
  const recipients = [
    ...new Set([...(reminder.employeeIds ?? []), ...(await holdersOf(reminder.roles ?? []))]),
  ];
  if (recipients.length === 0) {
    return 0;
  }
  if (!(await claimReminder(source, reminder.dedupeKey, recipients.length))) {
    // Already chased in this window.
    return 0;
  }
  try {
    // Through the same delivery path as everything else, so a kind somebody has turned
    // down is turned down here too — the sweep is exactly the thing that would otherwise
    // fill a bell nobody reads.
    return await deliver(recipients, {
      kind: reminder.kind,
      title: reminder.title,
      body: reminder.body,
      link: reminder.link,
    });
  } catch (error) {
    logger.error(error, `Reminder ${reminder.dedupeKey} could not be delivered`);
    return 0;
  }
}

/** Sends a batch and reports how many people were told. */
export async function sendReminders(source: string, reminders: Reminder[]): Promise<number> {
  let sent = 0;
  for (const reminder of reminders) {
    sent += await sendReminder(source, reminder);
  }
  return sent;
}
