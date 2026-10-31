import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { escapeHtml, rawHtml } from '../email/email.render';
import { renderStoredTemplate, sendTemplateEmail } from '../email/email.service';
import {
  MaActionItemModel,
  MaDecisionModel,
  MaDeliveryModel,
  MaMeetingModel,
  MaNotesModel,
  MaParticipantModel,
  type MaMeetingDocument,
} from './models';
import { getMaSettings } from './settings.service';

export const SUMMARY_TEMPLATE = 'meeting-assistant-summary';
/** How many times one recipient's failed send is retried before it waits for a person. */
export const MAX_DELIVERY_ATTEMPTS = 3;

type LeanMeeting = MaMeetingDocument & { _id: unknown };

/** An HTML bullet list, every item escaped; "None" when empty. */
export function htmlList(items: string[]): string {
  if (items.length === 0) {
    return '<br />None recorded.';
  }
  const rows = items.map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
  return `<ul>${rows}</ul>`;
}

function durationText(meeting: LeanMeeting): string {
  const end = meeting.endedAt ? new Date(meeting.endedAt).getTime() : Date.now();
  const minutes = Math.max(1, Math.round((end - new Date(meeting.startedAt).getTime()) / 60_000));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}

/** The meeting's start in its own time zone, the way the person who held it saw it. */
function meetingDate(meeting: LeanMeeting): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: meeting.timezone,
  }).format(new Date(meeting.startedAt));
}

function actionLine(item: {
  title: string;
  assignedTo?: string | null;
  dueText?: string | null;
  dueDate?: Date | null;
  needsConfirmation: boolean;
}): string {
  const owner = item.assignedTo ?? 'Owner not specified';
  const due = item.dueDate
    ? new Date(item.dueDate).toISOString().slice(0, 10)
    : (item.dueText ?? 'No deadline stated');
  const flag = item.needsConfirmation ? ' (to confirm)' : '';
  return `${item.title} — ${owner}, ${due}${flag}`;
}

/**
 * The template's values, built only from saved notes: nothing is generated here. `meetingUrl`
 * replaces the portal link for a reader who has no portal account (the public demo).
 */
export async function summaryVariables(meeting: LeanMeeting, meetingUrl?: string) {
  const meetingId = String(meeting._id);
  const notes = await MaNotesModel.findOne({ meetingId }).lean();
  if (!notes) {
    throw new Error('These notes are not ready yet.');
  }
  const decisions = await MaDecisionModel.find({ meetingId }).sort({ createdAt: 1 }).lean();
  const actions = await MaActionItemModel.find({ meetingId, status: { $ne: 'CANCELLED' } })
    .sort({ createdAt: 1 })
    .lean();
  return {
    version: notes.version,
    variables: {
      meetingTitle: meeting.title || 'Untitled meeting',
      meetingDate: meetingDate(meeting),
      duration: durationText(meeting),
      executiveSummary: notes.content.executiveSummary || notes.content.overview || 'Not specified',
      discussionPoints: rawHtml(htmlList(notes.content.discussionPoints)),
      decisions: rawHtml(htmlList(decisions.map((decision) => decision.text))),
      actionItems: rawHtml(htmlList(actions.map(actionLine))),
      meetingUrl:
        meetingUrl ?? `${env.meetAssistant.portalUrl}/me/meetings/list/${meetingId}/summary`,
    },
  };
}

/**
 * Who receives the summary: the owner's own verified address, the company's default
 * recipients (already restricted to allowed domains), and — when switched on — participants
 * matched to portal accounts. Never an address guessed from a name.
 */
export async function summaryRecipients(meeting: LeanMeeting): Promise<string[]> {
  const settings = await getMaSettings();
  const recipients = [meeting.ownerEmail, ...settings.defaultRecipients];
  if (settings.emailParticipants) {
    const matched = await MaParticipantModel.find({
      meetingId: String(meeting._id),
      userId: { $ne: null },
      email: { $ne: null },
    })
      .select('email')
      .lean();
    recipients.push(...matched.map((row) => row.email ?? ''));
  }
  return [...new Set(recipients.map((address) => address.trim().toLowerCase()).filter(Boolean))];
}

export async function previewSummary(meeting: LeanMeeting) {
  const { variables } = await summaryVariables(meeting);
  const rendered = await renderStoredTemplate(SUMMARY_TEMPLATE, variables);
  return {
    subject: rendered.subject,
    html: rendered.html,
    recipients: await summaryRecipients(meeting),
  };
}

/** Sends one delivery row, recording the outcome on it. */
async function sendDelivery(
  deliveryId: unknown,
  variables: Awaited<ReturnType<typeof summaryVariables>>['variables'],
) {
  const delivery = await MaDeliveryModel.findOneAndUpdate(
    { _id: deliveryId, status: { $ne: 'SENT' } },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!delivery) {
    return 'SENT';
  }
  try {
    await sendTemplateEmail({
      template: SUMMARY_TEMPLATE,
      to: delivery.recipient,
      variables,
      triggeredBy: 'Meeting Assistant',
    });
    await MaDeliveryModel.updateOne(
      { _id: delivery._id },
      { $set: { status: 'SENT', sentAt: new Date(), error: '' } },
    );
    return 'SENT';
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : 'Send failed';
    await MaDeliveryModel.updateOne(
      { _id: delivery._id },
      { $set: { status: 'FAILED', error: message } },
    );
    logger.warn({ meetingId: delivery.meetingId, err: message }, 'Meeting summary email failed');
    return 'FAILED';
  }
}

/** The meeting's email status from its deliveries for the current notes version. */
async function refreshEmailStatus(meetingId: string, version: number): Promise<void> {
  const rows = await MaDeliveryModel.find({ meetingId, notesVersion: version })
    .select('status')
    .lean();
  const sent = rows.filter((row) => row.status === 'SENT').length;
  let status: 'SENT' | 'PARTIAL' | 'FAILED' | 'QUEUED' = 'QUEUED';
  if (rows.length > 0 && sent === rows.length) {
    status = 'SENT';
  } else if (sent > 0) {
    status = 'PARTIAL';
  } else if (rows.some((row) => row.status === 'FAILED')) {
    status = 'FAILED';
  }
  await MaMeetingModel.updateOne({ _id: meetingId }, { $set: { emailStatus: status } });
}

/**
 * Emails the current notes to every recipient exactly once. The delivery row is inserted
 * BEFORE the send (unique per meeting, version and recipient), so a retried job finds it and
 * never sends the same version to the same person twice. Returns how many failed.
 */
export async function sendSummary(meeting: LeanMeeting, triggeredByName: string): Promise<number> {
  const meetingId = String(meeting._id);
  const { version, variables } = await summaryVariables(meeting);
  const recipients = await summaryRecipients(meeting);
  // One upsert per recipient, not bulkWrite: bulkWrite skips the tenant plugin's scoping.
  await Promise.all(
    recipients.map((recipient) =>
      MaDeliveryModel.updateOne(
        { meetingId, notesVersion: version, recipient },
        { $setOnInsert: { meetingId, notesVersion: version, recipient, triggeredByName } },
        { upsert: true },
      ),
    ),
  );
  const pending = await MaDeliveryModel.find({
    meetingId,
    notesVersion: version,
    status: { $ne: 'SENT' },
    attempts: { $lt: MAX_DELIVERY_ATTEMPTS },
  }).lean();
  const outcomes = await Promise.all(
    pending.map((delivery) => sendDelivery(delivery._id, variables)),
  );
  await refreshEmailStatus(meetingId, version);
  return outcomes.filter((outcome) => outcome === 'FAILED').length;
}

/** Sends one failed delivery again, on a person's request. */
export async function retryDelivery(meeting: LeanMeeting, deliveryId: string) {
  const { variables } = await summaryVariables(meeting);
  await MaDeliveryModel.updateOne({ _id: deliveryId, status: 'FAILED' }, { $set: { attempts: 0 } });
  await sendDelivery(deliveryId, variables);
  const delivery = await MaDeliveryModel.findById(deliveryId).lean();
  if (delivery) {
    await refreshEmailStatus(String(meeting._id), delivery.notesVersion);
  }
  return delivery;
}
