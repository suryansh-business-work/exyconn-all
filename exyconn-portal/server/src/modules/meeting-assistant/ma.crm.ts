import { MaActionItemModel, MaParticipantModel, type MaMeetingDocument } from './models';
import { fileMeetingNotesInCrm } from '../crm/crm.meeting-notes';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

type LeanMeeting = MaMeetingDocument & { _id: unknown };

/**
 * Hands finished notes to the CRM, which adds them to the timeline of every contact who joined
 * and to their open deals. Best-effort: the notes are already saved and their email is next, so
 * a CRM failure is logged and never fails the notes step (which would regenerate them).
 */
export async function shareNotesWithCrm(
  meeting: LeanMeeting,
  content: { executiveSummary: string; overview: string },
): Promise<void> {
  const meetingId = String(meeting._id);
  try {
    const [participants, actions] = await Promise.all([
      MaParticipantModel.find({ meetingId, email: { $ne: null } })
        .select('email')
        .lean(),
      MaActionItemModel.find({ meetingId })
        .sort({ createdAt: 1 })
        .select('title assignedTo dueText')
        .lean(),
    ]);
    const reached = await fileMeetingNotesInCrm({
      meetingId,
      title: meeting.title,
      startedAt: meeting.startedAt,
      endedAt: meeting.endedAt ?? null,
      ownerName: meeting.ownerName,
      summary: content.executiveSummary || content.overview,
      actionItems: actions.map((a) => ({
        title: a.title,
        assignedTo: a.assignedTo ?? null,
        dueText: a.dueText ?? null,
      })),
      participantEmails: participants.map((p) => p.email ?? ''),
      meetingUrl: `${env.meetAssistant.portalUrl}/me/meetings/list/${meetingId}/summary`,
    });
    if (reached > 0) {
      logger.info(`Meeting ${meetingId} notes filed on ${reached} CRM record(s)`);
    }
  } catch (error) {
    logger.error({ err: error }, `Meeting ${meetingId} notes could not be filed in the CRM`);
  }
}
