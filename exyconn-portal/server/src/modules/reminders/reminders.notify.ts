import { ReminderLogModel } from './reminder-log.model';
import { UserModel } from '../admin/user.model';
import { NotificationModel } from '../notifications/notification.model';
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
 * Sends one reminder, at most once for its window.
 *
 * The log row is claimed FIRST, by an upsert that reports whether it was the one to insert
 * it: whoever inserts, sends. Sending first and recording after would double-notify on any
 * crash in between, and a duplicate nag is the failure this whole mechanism exists to
 * avoid. The unique index behind it settles the case of two processes sweeping at once.
 */
export async function sendReminder(source: string, reminder: Reminder): Promise<number> {
  const recipients = [
    ...new Set([...(reminder.employeeIds ?? []), ...(await holdersOf(reminder.roles ?? []))]),
  ];
  if (recipients.length === 0) {
    return 0;
  }
  const claim = await ReminderLogModel.updateOne(
    { dedupeKey: reminder.dedupeKey },
    { $setOnInsert: { source, dedupeKey: reminder.dedupeKey, recipients: recipients.length } },
    { upsert: true },
  );
  if (!claim.upsertedCount) {
    // Already chased in this window.
    return 0;
  }
  try {
    await NotificationModel.insertMany(
      recipients.map((employeeId) => ({
        employeeId,
        kind: reminder.kind,
        title: reminder.title,
        body: reminder.body,
        link: reminder.link,
      })),
    );
  } catch (error) {
    logger.error(error, `Reminder ${reminder.dedupeKey} could not be delivered`);
    return 0;
  }
  return recipients.length;
}

/** Sends a batch and reports how many people were told. */
export async function sendReminders(source: string, reminders: Reminder[]): Promise<number> {
  let sent = 0;
  for (const reminder of reminders) {
    sent += await sendReminder(source, reminder);
  }
  return sent;
}
