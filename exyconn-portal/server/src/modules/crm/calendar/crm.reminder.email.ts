import { formatInTimeZone } from 'date-fns-tz';
import { ActivityModel } from '../activity.model';
import { UserModel } from '../../admin/user.model';
import { emailer } from '../../email';
import { channelsFor, NotificationModel } from '../../notifications';
import { forEachOrganization } from '../../organizations';
import { registerBackgroundJob } from '../../tech/jobs.registry';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { JOB_KEYS, recordJobRun } from '../../../utils/jobHeartbeat';
import { houseClock, type HouseClock } from '../crm.house-clock';

/** How often the job asks whether a reminder is due — a reminder for 10:00 arrives by 10:01. */
const TICK_MS = 60_000;
/** Due reminders one tick sends for one company before leaving the rest to the next tick. */
const MAX_PER_TICK = 50;
/** Failed sends before the job stops retrying one reminder. */
export const MAX_REMINDER_ATTEMPTS = 5;
/** The notification kind CRM follow-ups already use, so one preference governs both. */
const KIND = 'CRM';

/** A claimed reminder, as the send reads it. */
interface DueReminder {
  _id: unknown;
  subject: string;
  notes?: string;
  relatedType?: string;
  relatedId?: string;
  relatedName?: string;
  remindAt: Date;
  assigneeId: string;
}

/** Where the reminder's link lands: the record's own page in the CRM. */
export function reminderLink(reminder: Pick<DueReminder, 'relatedType' | 'relatedId'>): string {
  const pages: Record<string, string> = { CONTACT: 'contacts', COMPANY: 'companies' };
  const page = reminder.relatedType ? pages[reminder.relatedType] : undefined;
  if (page && reminder.relatedId) {
    return `${env.crmUrl}/${page}/${reminder.relatedId}`;
  }
  return reminder.relatedType === 'DEAL' ? `${env.crmUrl}/deals` : `${env.crmUrl}/calendar`;
}

/**
 * Takes the next due reminder, stamping it as sent in the same operation. The stamp is the
 * claim: two ticks or two processes racing cannot both match it, so a reminder goes out once
 * or not at all. A done task, an archived one or one that ran out of retries is never claimed.
 */
async function claimNext(now: Date, failed: readonly unknown[]): Promise<DueReminder | null> {
  return ActivityModel.findOneAndUpdate(
    {
      _id: { $nin: failed },
      remindAt: { $ne: null, $lte: now },
      reminderSentAt: null,
      done: false,
      assigneeId: { $nin: ['', null] },
      reminderAttempts: { $not: { $gte: MAX_REMINDER_ATTEMPTS } },
      archivedAt: null,
    },
    { $set: { reminderSentAt: now } },
    { new: true, sort: { remindAt: 1 } },
  ).lean<DueReminder>();
}

/** Puts a failed reminder back in the queue for the next tick, one attempt used. */
async function release(reminder: DueReminder): Promise<void> {
  await ActivityModel.updateOne(
    { _id: reminder._id },
    { $set: { reminderSentAt: null }, $inc: { reminderAttempts: 1 } },
  );
}

/** The bell copy, on the channel the assignee left switched on. */
async function ring(assigneeId: string, title: string, body: string, link: string): Promise<void> {
  const channels = await channelsFor([assigneeId], KIND);
  if (channels.get(assigneeId)?.inPortal) {
    await NotificationModel.create({ employeeId: assigneeId, kind: KIND, title, body, link });
  }
}

/** Emails one claimed reminder to its assignee. Throws when the email could not be sent. */
async function send(reminder: DueReminder, clock: HouseClock): Promise<boolean> {
  const user = await UserModel.findOne({ _id: reminder.assigneeId, isActive: true })
    .select('name email')
    .lean();
  if (!user) {
    // Nobody left to tell: the claim stands, so the job does not retry a reminder for ever.
    logger.warn(`CRM reminder ${String(reminder._id)} has no active assignee; not sent`);
    return false;
  }
  const when = formatInTimeZone(reminder.remindAt, clock.timezone, clock.pattern);
  const about = reminder.relatedName ? ` (${reminder.relatedName})` : '';
  const title = `Reminder: ${reminder.subject}${about}`;
  const note = reminder.notes ? `\n\n${reminder.notes}` : '';
  const body = `Due ${when} (${clock.timezone}).${note}`;
  const link = reminderLink(reminder);
  await emailer.send({
    template: 'notification',
    to: user.email,
    variables: { name: user.name, title, body, actionUrl: link },
    triggeredBy: 'CRM reminder',
  });
  await ring(reminder.assigneeId, title, body, link).catch((error: unknown) =>
    logger.warn({ err: error }, 'CRM reminder notification failed'),
  );
  return true;
}

/** Sends every reminder whose time has come for the company in scope; returns how many went. */
export async function dispatchDueCrmReminders(now = new Date()): Promise<number> {
  const clock = await houseClock();
  // A reminder that failed is retried on the next tick, not again straight away in this one.
  const failed: unknown[] = [];
  let sent = 0;
  for (let taken = 0; taken < MAX_PER_TICK; taken += 1) {
    const reminder = await claimNext(now, failed);
    if (!reminder) {
      break;
    }
    try {
      sent += (await send(reminder, clock)) ? 1 : 0;
    } catch (error) {
      logger.error(error, `CRM reminder ${String(reminder._id)} could not be emailed`);
      failed.push(reminder._id);
      await release(reminder);
    }
  }
  return sent;
}

/** Starts the once-a-minute check that emails CRM reminders at their time. */
export function startCrmReminderEmails(): void {
  const tick = () => {
    let sent = 0;
    forEachOrganization(async () => {
      sent += await dispatchDueCrmReminders();
    }, 'CRM reminders')
      .then(() => recordJobRun(JOB_KEYS.crmReminders, `${sent} CRM reminder(s) emailed`))
      .catch((error: unknown) => logger.error(error, 'CRM reminder check failed'));
  };
  tick();
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('CRM reminder emails started');
}

registerBackgroundJob({
  key: JOB_KEYS.crmReminders,
  label: 'CRM reminders',
  description: 'Emails each CRM reminder to its assignee when its time comes.',
  runOnce: () => dispatchDueCrmReminders(),
});
