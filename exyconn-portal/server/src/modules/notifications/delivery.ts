import { NotificationModel } from './notification.model';
import { channelsFor } from './preferences.service';
import { UserModel } from '../admin/user.model';
import { emailer } from '../email';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

/** One notification, as every caller in the server describes it. */
export interface NotificationInput {
  kind: string;
  title: string;
  body?: string;
  link?: string;
}

/** Where a link in a notification email has to point to be clickable. */
const portalUrl = (link: string | undefined): string =>
  link ? `${env.appUrl}${link.startsWith('/') ? link : `/${link}`}` : env.appUrl;

/**
 * Delivers one notification to a set of people, on the channels each of them chose.
 *
 * Every path in the server goes through here — a decision, a reminder, an HR broadcast — so
 * somebody who has turned a kind off has turned it off everywhere, and a new caller cannot
 * accidentally ignore that.
 *
 * Email is best-effort and per recipient: one address that bounces must not stop the other
 * forty, and a notification is never important enough to fail the thing that caused it.
 */
export async function deliver(
  employeeIds: readonly string[],
  input: NotificationInput,
): Promise<number> {
  if (employeeIds.length === 0) {
    return 0;
  }
  const channels = await channelsFor(employeeIds, input.kind);
  const inPortal = employeeIds.filter((id) => channels.get(id)?.inPortal);
  const byEmail = employeeIds.filter((id) => channels.get(id)?.email);

  if (inPortal.length > 0) {
    await NotificationModel.insertMany(
      inPortal.map((employeeId) => ({
        employeeId,
        kind: input.kind,
        title: input.title,
        body: input.body ?? '',
        link: input.link ?? null,
      })),
    );
  }
  if (byEmail.length > 0) {
    await mailEach(byEmail, input);
  }
  return inPortal.length;
}

async function mailEach(employeeIds: readonly string[], input: NotificationInput): Promise<void> {
  const users = await UserModel.find({ _id: { $in: [...employeeIds] }, isActive: true })
    .select('name email')
    .lean();
  await Promise.allSettled(
    users.map(async (user) => {
      try {
        await emailer.send({
          template: 'notification',
          to: user.email,
          variables: {
            name: user.name,
            title: input.title,
            body: input.body ?? '',
            actionUrl: portalUrl(input.link),
          },
          triggeredBy: 'notification preferences',
        });
      } catch (error) {
        logger.error(error, `Notification email to ${user.email} failed`);
      }
    }),
  );
}
