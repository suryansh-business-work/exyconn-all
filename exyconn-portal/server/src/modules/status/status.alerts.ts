import { TrackerBuildSettingsModel } from '../tech/tracker-build-settings.model';
import { UserModel } from '../admin/user.model';
import { ROLES } from '../../constants/roles';
import { notifyStatusSubscribers } from './status.subscribers';
import { slackNotifier } from '../../utils/slack';
import { mailer } from '../../utils/mailer';
import { logger } from '../../utils/logger';

export type IncidentChange = 'OPENED' | 'RESOLVED';

export interface AlertedMonitor {
  key: string;
  name: string;
  url: string;
}

/** The one line both Slack and the email subject carry. */
function headline(change: IncidentChange, monitor: AlertedMonitor): string {
  if (change === 'OPENED') {
    return `${monitor.name} is down`;
  }
  return `${monitor.name} is back up`;
}

function slackText(change: IncidentChange, monitor: AlertedMonitor, reason: string): string {
  const icon = change === 'OPENED' ? ':red_circle:' : ':large_green_circle:';
  const detail = change === 'OPENED' ? `Reason: ${reason || 'no response'}` : 'Incident resolved.';
  return `${icon} *${headline(change, monitor)}* — ${monitor.url}\n${detail}`;
}

function emailBody(change: IncidentChange, monitor: AlertedMonitor, reason: string): string {
  const detail =
    change === 'OPENED'
      ? `The monitor has failed enough consecutive checks to open an incident.\nReason: ${reason || 'no response'}`
      : 'The monitor is answering again and the incident has been resolved.';
  return `${headline(change, monitor)}\n\nURL: ${monitor.url}\n${detail}`;
}

/** Posts to every channel picked under Tech → Settings → Status alerts. */
async function alertSlack(change: IncidentChange, monitor: AlertedMonitor, reason: string) {
  const settings = await TrackerBuildSettingsModel.findOne({ key: 'default' })
    .select('statusAlertChannels')
    .lean();
  const text = slackText(change, monitor, reason);
  for (const channel of settings?.statusAlertChannels ?? []) {
    await slackNotifier.sendMessage(text, channel);
  }
}

/** Emails everyone who holds the Tech role and still has an active account. */
async function alertTechTeam(change: IncidentChange, monitor: AlertedMonitor, reason: string) {
  const team = await UserModel.find({ roles: ROLES.TECH, isActive: true })
    .select('name email')
    .lean();
  const subject = `[Status] ${headline(change, monitor)}`;
  const message = emailBody(change, monitor, reason);
  for (const member of team) {
    await mailer.sendCustomEmail({ name: member.name, email: member.email, subject, message });
  }
}

/** Tells everyone who asked the status page to keep them posted. */
async function alertSubscribers(change: IncidentChange, monitor: AlertedMonitor, reason: string) {
  const opened = change === 'OPENED';
  await notifyStatusSubscribers({
    headline: headline(change, monitor),
    detail: opened ? reason || 'No response from the service.' : 'The service is answering again.',
    serviceName: monitor.name,
    url: monitor.url,
  });
}

/**
 * Tells the team and the public an incident opened or resolved. Every channel is
 * best-effort and independent: a Slack token that has expired must not stop the email,
 * a bounced subscriber must not stop the team's alert, and no failure may reach the probe
 * loop, which has an incident to record regardless.
 */
export async function announceIncident(
  change: IncidentChange,
  monitor: AlertedMonitor,
  reason: string,
): Promise<void> {
  const results = await Promise.allSettled([
    alertSlack(change, monitor, reason),
    alertTechTeam(change, monitor, reason),
    alertSubscribers(change, monitor, reason),
  ]);
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.error({ err: result.reason }, `Status alert for ${monitor.key} (${change}) failed`);
    }
  }
}

/** What a planned window is called in the notice, so both the subject and body agree. */
function maintenanceHeadline(title: string): string {
  return `Planned maintenance: ${title}`;
}

/**
 * Tells subscribers about a window somebody scheduled. Same fan-out as an incident, and
 * best-effort for the same reason: the window is already saved, and a mail outage must
 * not make Tech believe the plan was lost.
 */
export async function announceMaintenance(window: {
  title: string;
  body: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<void> {
  const when = `${window.startsAt.toISOString()} — ${window.endsAt.toISOString()}`;
  try {
    await notifyStatusSubscribers({
      headline: maintenanceHeadline(window.title),
      detail: `${window.body}\n\nScheduled for ${when}.`,
      serviceName: window.title,
      url: '',
    });
  } catch (error) {
    logger.error({ err: error }, `Maintenance notice for "${window.title}" failed`);
  }
}
