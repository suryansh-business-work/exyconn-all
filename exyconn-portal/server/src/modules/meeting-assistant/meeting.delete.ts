import {
  MaActionItemModel,
  MaChunkModel,
  MaDecisionModel,
  MaDeliveryModel,
  MaEventModel,
  MaJobModel,
  MaMeetingModel,
  MaNotesModel,
  MaParticipantModel,
  MaSegmentModel,
} from './models';
import { deleteRecordings } from './recording.store';
import { deleteScreenPieces } from './screen.store';

/**
 * Deletes a meeting and everything recorded for it: saved audio, the screen recording,
 * transcript, participants, notes, decisions, actions, email deliveries, queued steps and its
 * log. The audit log keeps its own line that the deletion happened.
 */
export async function deleteMeetingData(meetingId: string): Promise<void> {
  await MaJobModel.deleteMany({ meetingId });
  await deleteRecordings({ meetingId });
  await deleteScreenPieces({ meetingId });
  const byMeeting = { meetingId };
  await Promise.all([
    MaSegmentModel.deleteMany(byMeeting),
    MaChunkModel.deleteMany(byMeeting),
    MaParticipantModel.deleteMany(byMeeting),
    MaNotesModel.deleteMany(byMeeting),
    MaDecisionModel.deleteMany(byMeeting),
    MaActionItemModel.deleteMany(byMeeting),
    MaDeliveryModel.deleteMany(byMeeting),
    MaEventModel.deleteMany(byMeeting),
  ]);
  await MaMeetingModel.deleteOne({ _id: meetingId });
}
