import {
  MaGoogleConnectionModel,
  MaMeetingModel,
  MaSegmentModel,
  type MaMeetingDocument,
} from './models';
import {
  accessTokenFor,
  displayNameOf,
  meetApi,
  type ConferenceRecord,
  type MeetParticipant,
} from './google-meet.client';
import { replaceWithOfficial, type OfficialParticipant } from './participants.service';

/** Google has not produced the record (or the transcript) yet: try again later. */
export class OfficialNotReady extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfficialNotReady';
  }
}

/** How far a conference record may start from our session's start and still be this call. */
const MATCH_WINDOW_MS = 30 * 60_000;

type LeanMeeting = MaMeetingDocument & { _id: unknown };

const ms = (value?: string) => (value ? new Date(value).getTime() : Number.NaN);

/** The conference record of this call: the one starting closest to our session's start. */
export function matchRecord(records: ConferenceRecord[], startedAt: Date): ConferenceRecord | null {
  const target = startedAt.getTime();
  const near = records
    .filter((record) => Math.abs(ms(record.startTime) - target) <= MATCH_WINDOW_MS)
    .slice()
    .sort((a, b) => Math.abs(ms(a.startTime) - target) - Math.abs(ms(b.startTime) - target));
  return near[0] ?? null;
}

function officialParticipants(
  token: string,
  people: MeetParticipant[],
): Promise<OfficialParticipant[]> {
  return Promise.all(
    people.map(async (person) => {
      const sessions = await meetApi.participantSessions(token, person.name);
      return {
        key: `meet:${person.name}`,
        displayName: displayNameOf(person),
        sessions: sessions
          .filter((session) => session.startTime)
          .map((session) => ({
            joinedAt: new Date(session.startTime ?? ''),
            leftAt: session.endTime ? new Date(session.endTime) : null,
          })),
      };
    }),
  );
}

/** Writes the official transcript as GOOGLE_MEET segments, replacing any earlier import. */
async function saveTranscript(
  meeting: LeanMeeting,
  token: string,
  transcripts: Array<{ name: string }>,
  names: Map<string, string>,
): Promise<number> {
  const meetingId = String(meeting._id);
  const start = new Date(meeting.startedAt).getTime();
  const perTranscript = await Promise.all(
    transcripts.map((transcript) => meetApi.entries(token, transcript.name)),
  );
  const rows = perTranscript.flatMap((entries, chunkSeq) =>
    entries.flatMap((entry, index) => {
      const text = (entry.text ?? '').trim();
      if (text === '') {
        return [];
      }
      const startMs = Math.max(0, ms(entry.startTime) - start || 0);
      return [
        {
          meetingId,
          source: 'GOOGLE_MEET',
          stream: 'MEET',
          chunkSeq,
          index,
          startMs,
          endMs: Math.max(startMs, ms(entry.endTime) - start || startMs),
          text,
          language: entry.languageCode ?? null,
          speakerLabel: names.get(entry.participant ?? '') ?? null,
        },
      ];
    }),
  );
  await MaSegmentModel.deleteMany({ meetingId, source: 'GOOGLE_MEET' });
  if (rows.length > 0) {
    await MaSegmentModel.insertMany(rows);
  }
  return rows.length;
}

/**
 * Imports Google Meet's official record of the call: who joined (with every join and leave)
 * and, when transcription was on, the transcript. Throws OfficialNotReady while Google is
 * still producing it, so the job waits and tries again.
 */
export async function importOfficialRecord(meeting: LeanMeeting): Promise<void> {
  const connection = await MaGoogleConnectionModel.findOne({ userId: meeting.ownerId });
  if (!connection) {
    throw new Error('The meeting owner has not connected Google Meet.');
  }
  let token: string;
  try {
    token = await accessTokenFor(connection.refreshToken);
  } catch (error) {
    connection.lastError = error instanceof Error ? error.message : 'Token refresh failed';
    await connection.save();
    throw error;
  }
  const record = matchRecord(
    await meetApi.conferenceRecords(token, meeting.meetingCode),
    new Date(meeting.startedAt),
  );
  if (!record?.endTime) {
    throw new OfficialNotReady('Google has not finished the conference record yet.');
  }
  const transcripts = await meetApi.transcripts(token, record.name);
  if (transcripts.some((transcript) => transcript.state === 'STARTED')) {
    throw new OfficialNotReady('Google is still producing the transcript.');
  }
  const people = await meetApi.participants(token, record.name);
  await replaceWithOfficial(String(meeting._id), await officialParticipants(token, people));
  const names = new Map(people.map((person) => [person.name, displayNameOf(person)]));
  const official = await saveTranscript(meeting, token, transcripts, names);
  const segmentCount = await MaSegmentModel.countDocuments({ meetingId: String(meeting._id) });
  await MaMeetingModel.updateOne(
    { _id: meeting._id },
    {
      $set: {
        segmentCount,
        participantCount: people.length,
        // Verified by Google itself: a transcript exists exactly when transcription was on.
        transcriptionState: official > 0 ? 'ON' : 'OFF',
      },
    },
  );
  connection.lastError = '';
  await connection.save();
}
