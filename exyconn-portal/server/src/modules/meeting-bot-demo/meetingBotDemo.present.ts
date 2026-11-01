import {
  MaActionItemModel,
  MaBotDispatchModel,
  MaDecisionModel,
  MaMeetingModel,
  MaNotesModel,
} from '../meeting-assistant/models';
import type { MeetingBotDemoTripDocument } from './meetingBotDemo.model';

type TripRow = MeetingBotDemoTripDocument & { _id: unknown };

/** The notes a visitor sees: the summary, what was discussed and decided, and the actions. */
async function summaryOf(meetingId: string) {
  const [meeting, notes] = await Promise.all([
    MaMeetingModel.findById(meetingId).select('title summaryStatus').lean(),
    MaNotesModel.findOne({ meetingId }).lean(),
  ]);
  if (!meeting) {
    return { summaryStatus: 'NOT_STARTED', summary: null };
  }
  if (!notes) {
    return { summaryStatus: meeting.summaryStatus, summary: null };
  }
  const [decisions, actions] = await Promise.all([
    MaDecisionModel.find({ meetingId }).sort({ createdAt: 1, _id: 1 }).lean(),
    MaActionItemModel.find({ meetingId, status: { $ne: 'CANCELLED' } })
      .sort({ createdAt: 1, _id: 1 })
      .lean(),
  ]);
  return {
    summaryStatus: meeting.summaryStatus,
    summary: {
      title: meeting.title,
      executiveSummary: notes.content.executiveSummary || notes.content.overview,
      discussionPoints: notes.content.discussionPoints,
      decisions: decisions.map((decision) => decision.text),
      actionItems: actions.map((item) => ({
        id: String(item._id),
        title: item.title,
        assignedTo: item.assignedTo ?? null,
        dueDate: item.dueDate ?? null,
        dueText: item.dueText ?? null,
      })),
    },
  };
}

/** A trip as the visitor sees it: the bot's progress and, once ready, the meeting's notes. */
export async function presentTrip(trip: TripRow) {
  const dispatch = await MaBotDispatchModel.findById(trip.dispatchId).lean();
  const meetingId = trip.purgedAt ? null : (dispatch?.meetingId ?? null);
  const notes = meetingId
    ? await summaryOf(meetingId)
    : { summaryStatus: 'NOT_STARTED', summary: null };
  return {
    id: String(trip._id),
    meetingCode: trip.meetingCode,
    meetUrl: dispatch?.meetUrl ?? `https://meet.google.com/${trip.meetingCode}`,
    status: dispatch?.status ?? 'FAILED',
    error: dispatch?.error ?? '',
    createdAt: trip.createdAt,
    finishedAt: dispatch?.finishedAt ?? null,
    emailedAt: trip.emailedAt,
    purgeAfter: trip.purgeAfter,
    purged: Boolean(trip.purgedAt),
    ...notes,
  };
}
