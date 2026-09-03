import { NotificationModel } from './notification.model';
import { UserModel } from '../admin/user.model';
import { logger } from '../../utils/logger';

export interface NotifyPayload {
  kind: string;
  title: string;
  body?: string;
  link?: string;
}

/** Drops a notification for one employee. */
export async function notify(employeeId: string, payload: NotifyPayload): Promise<void> {
  await NotificationModel.create({ employeeId, ...payload });
}

/**
 * Fans a notification out to every active employee. Used for company-wide events
 * like a new announcement. Failure is logged, never thrown — a notification is
 * never important enough to fail the action that triggered it.
 */
export async function notifyEveryone(payload: NotifyPayload): Promise<void> {
  try {
    const users = await UserModel.find({ isActive: true }).select('_id').lean();
    if (users.length === 0) return;
    await NotificationModel.insertMany(
      users.map((user) => ({ employeeId: String(user._id), ...payload })),
    );
  } catch (error) {
    logger.error(error, 'Failed to fan out notification');
  }
}

export interface BroadcastInput extends NotifyPayload {
  audience: 'ALL' | 'DEPARTMENT' | 'EMPLOYEES';
  department?: string | null;
  employeeIds?: string[] | null;
}

/** Who a broadcast reaches. Always active users only; a deactivated account never gets one. */
export async function resolveRecipients(input: BroadcastInput): Promise<string[]> {
  const base: Record<string, unknown> = { isActive: true };
  if (input.audience === 'DEPARTMENT') {
    if (!input.department) throw new Error('department is required for a DEPARTMENT audience');
    base.department = input.department;
  } else if (input.audience === 'EMPLOYEES') {
    if (!input.employeeIds?.length)
      throw new Error('employeeIds is required for an EMPLOYEES audience');
    base._id = { $in: input.employeeIds };
  }
  const users = await UserModel.find(base).select('_id').lean();
  return users.map((u) => String(u._id));
}

/** HR broadcast. Unlike notifyEveryone this throws, because the sender is waiting for a count. */
export async function broadcast(input: BroadcastInput): Promise<number> {
  const recipients = await resolveRecipients(input);
  if (recipients.length === 0) return 0;
  const { kind, title, body, link } = input;
  await NotificationModel.insertMany(
    recipients.map((employeeId) => ({ employeeId, kind, title, body, link })),
  );
  return recipients.length;
}
