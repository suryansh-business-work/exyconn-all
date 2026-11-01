import { ActivityModel } from './activity.model';
import { ContactModel } from './contact.model';
import { DealModel } from './deal.model';
import { CLOSED_DEAL_STAGES } from './crm.deal-closed';
import { scoreDealsOfContacts } from './deal-score';
import { logger } from '../../utils/logger';

/**
 * When the Meeting Assistant finishes notes for a call, the CRM learns about it: every contact
 * who joined (matched by a verified participant address, never guessed from a name) gets a
 * MEETING activity on their timeline with the summary and action items, and so does each of
 * their open deals. Rewritten in place on a regenerate (keyed by `sourceKey`), never duplicated.
 */

export interface MeetingNotesForCrm {
  meetingId: string;
  title: string;
  startedAt: Date;
  endedAt: Date | null;
  ownerName: string;
  summary: string;
  actionItems: { title: string; assignedTo: string | null; dueText: string | null }[];
  /** Verified addresses of the people who joined. */
  participantEmails: string[];
  meetingUrl: string;
}

interface Target {
  relatedType: 'CONTACT' | 'DEAL';
  relatedId: string;
  relatedName: string;
}

function actionLine(item: MeetingNotesForCrm['actionItems'][number]): string {
  const owner = item.assignedTo ? ` (${item.assignedTo})` : '';
  const due = item.dueText ? `, due ${item.dueText}` : '';
  return `- ${item.title}${owner}${due}`;
}

function notesText(meeting: MeetingNotesForCrm): string {
  const actions = meeting.actionItems.length
    ? meeting.actionItems.map(actionLine).join('\n')
    : '- None recorded';
  return [
    meeting.summary || 'No summary was written for this meeting.',
    '',
    'Action items:',
    actions,
    '',
    `Full notes: ${meeting.meetingUrl}`,
  ].join('\n');
}

/** Contacts and their open deals that this meeting belongs on. */
async function targetsFor(emails: string[]): Promise<{ targets: Target[]; contactIds: string[] }> {
  const contacts = await ContactModel.find({
    $or: [{ email: { $in: emails } }, { 'emails.address': { $in: emails } }],
  })
    .select('name')
    .lean();
  const contactIds = contacts.map((c) => String(c._id));
  const deals = await DealModel.find({
    contactId: { $in: contactIds },
    stage: { $nin: [...CLOSED_DEAL_STAGES] },
  })
    .select('title')
    .lean();
  const targets: Target[] = [
    ...contacts.map((c) => ({
      relatedType: 'CONTACT' as const,
      relatedId: String(c._id),
      relatedName: c.name,
    })),
    ...deals.map((d) => ({
      relatedType: 'DEAL' as const,
      relatedId: String(d._id),
      relatedName: d.title,
    })),
  ];
  return { targets, contactIds };
}

/** Files the meeting on every matching contact and open deal. Returns how many records it reached. */
export async function fileMeetingNotesInCrm(meeting: MeetingNotesForCrm): Promise<number> {
  const emails = [...new Set(meeting.participantEmails.map((e) => e.trim().toLowerCase()))].filter(
    Boolean,
  );
  if (emails.length === 0) {
    return 0;
  }
  const { targets, contactIds } = await targetsFor(emails);
  if (targets.length === 0) {
    return 0;
  }
  const durationSeconds = meeting.endedAt
    ? Math.round((meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 1000)
    : null;
  const notes = notesText(meeting);
  await Promise.all(
    targets.map((target) =>
      ActivityModel.updateOne(
        { sourceKey: `meeting:${meeting.meetingId}:${target.relatedType}:${target.relatedId}` },
        {
          $set: {
            ...target,
            type: 'MEETING',
            subject: `Meeting: ${meeting.title || 'Google Meet call'}`,
            notes,
            done: true,
            owner: meeting.ownerName || 'Meeting Assistant',
            durationSeconds,
          },
        },
        { upsert: true },
      ),
    ),
  );
  // A meeting is the strongest activity signal there is; the deals should show it now.
  scoreDealsOfContacts(contactIds).catch((error: unknown) =>
    logger.error({ err: error }, 'Deals could not be rescored after a meeting'),
  );
  return targets.length;
}
