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
