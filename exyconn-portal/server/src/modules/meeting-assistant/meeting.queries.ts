import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';
import { registerTable } from '../table-transfer/registry';
import {
  MaActionItemModel,
  MaEventModel,
  MaMeetingModel,
  MaParticipantModel,
  MaSegmentModel,
  type MaMeetingDocument,
} from './models';
import { OPEN_ACTION_STATUSES } from './ma.enums';
import { confirmedSpeaker } from './speakers';
import type { MaScopeFilter } from './ma.access';

export const MEETINGS_TABLE: TableConfig = {
  searchFields: ['title', 'meetingCode', 'ownerName'],
  filterFields: [
    'status',
    'summaryStatus',
    'emailStatus',
    'language',
    'ownerId',
    'meetingCode',
    'transcriptionState',
  ],
  sortFields: ['startedAt', 'title', 'participantCount', 'ownerName'],
  defaultSort: { field: 'startedAt', dir: 'DESC' },
};
export const PARTICIPANTS_TABLE: TableConfig = {
  searchFields: ['displayName', 'email'],
  filterFields: ['status', 'source', 'userId', 'meetingId'],
  sortFields: ['createdAt', 'displayName', 'totalSeconds'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};
export const TRANSCRIPT_TABLE: TableConfig = {
  searchFields: ['text', 'speakerLabel'],
  filterFields: ['meetingId', 'source', 'language'],
  sortFields: ['startMs', 'createdAt'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};
export const EVENTS_TABLE: TableConfig = {
  searchFields: ['message', 'meetingTitle', 'actorName', 'type'],
  filterFields: ['level', 'type', 'meetingId', 'actorId'],
  sortFields: ['createdAt'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};
registerTable('maMeetingsPaged', MEETINGS_TABLE);
registerTable('maParticipantsPaged', PARTICIPANTS_TABLE);
registerTable('maTranscriptSearch', TRANSCRIPT_TABLE);
registerTable('maEventsPaged', EVENTS_TABLE);

/** The most transcript lines one request returns. */
export const MAX_TRANSCRIPT_LINES = 500;

type LeanMeeting = MaMeetingDocument & { _id: unknown };
type Scope = MaScopeFilter;

const idOf = (doc: { _id: unknown }) => String(doc._id);

/** Seconds the call lasted, or has lasted so far. */
export function durationSeconds(
  meeting: Pick<MaMeetingDocument, 'startedAt' | 'endedAt'>,
  now = Date.now(),
): number {
  const end = meeting.endedAt ? new Date(meeting.endedAt).getTime() : now;
  return Math.max(0, Math.round((end - new Date(meeting.startedAt).getTime()) / 1000));
}

/** Meetings as the API returns them, with action counts from ONE aggregate for the page. */
export async function presentMeetings(meetings: LeanMeeting[]) {
  const ids = meetings.map(idOf);
  const counts = await MaActionItemModel.aggregate<{ _id: string; total: number; open: number }>([
    { $match: { meetingId: { $in: ids } } },
    {
      $group: {
        _id: '$meetingId',
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $in: ['$status', [...OPEN_ACTION_STATUSES]] }, 1, 0] } },
      },
    },
  ]);
  const byMeeting = new Map(counts.map((row) => [row._id, row]));
  return meetings.map((meeting) => ({
    ...meeting,
    id: idOf(meeting),
    durationSeconds: durationSeconds(meeting),
    recordingSeconds: Math.round(meeting.recordingSeconds ?? 0),
    actionItemCount: byMeeting.get(idOf(meeting))?.total ?? 0,
    openActionCount: byMeeting.get(idOf(meeting))?.open ?? 0,
  }));
}

export async function meetingsPage(input: TableQueryInput, scope: Scope) {
  const page = await tableQuery(MaMeetingModel, input, MEETINGS_TABLE, scope);
  return { rows: await presentMeetings(page.rows as LeanMeeting[]), totalCount: page.totalCount };
}

/** The ids of the meetings a scope covers, for collections that hang off a meeting. */
async function meetingIdsIn(scope: Scope): Promise<string[] | null> {
  if (Object.keys(scope).length === 0) {
    return null;
  }
  const rows = await MaMeetingModel.find(scope).select('_id').lean();
  return rows.map(idOf);
}

async function meetingFacts(ids: string[]) {
  const meetings = await MaMeetingModel.find({ _id: { $in: [...new Set(ids)] } })
    .select('title startedAt speakerMappings')
    .lean<LeanMeeting[]>();
  return new Map(meetings.map((meeting) => [idOf(meeting), meeting]));
}

export async function participantsPage(input: TableQueryInput, scope: Scope) {
  const ids = await meetingIdsIn(scope);
  const page = await tableQuery(
    MaParticipantModel,
    input,
    PARTICIPANTS_TABLE,
    ids ? { meetingId: { $in: ids } } : {},
  );
  const rows = page.rows as Array<{ _id: unknown; meetingId: string }>;
  const facts = await meetingFacts(rows.map((row) => row.meetingId));
  return {
    totalCount: page.totalCount,
    rows: rows.map((row) => ({
      ...row,
      id: idOf(row),
      meetingTitle: facts.get(row.meetingId)?.title ?? '',
      meetingStartedAt: facts.get(row.meetingId)?.startedAt ?? new Date(0),
    })),
  };
}

export async function meetingParticipants(meetingId: string) {
  const rows = await MaParticipantModel.find({ meetingId }).sort({ createdAt: 1 }).lean();
  const facts = await meetingFacts([meetingId]);
  return rows.map((row) => ({
    ...row,
    id: idOf(row),
    meetingTitle: facts.get(meetingId)?.title ?? '',
    meetingStartedAt: facts.get(meetingId)?.startedAt ?? new Date(0),
  }));
}

export interface TranscriptSlice {
  source?: 'GOOGLE_MEET' | 'AI' | null;
  afterMs?: number | null;
  limit?: number | null;
}

/** A slice of one meeting's transcript in time order, with confirmed speaker names. */
export async function transcriptSlice(meeting: LeanMeeting, slice: TranscriptSlice) {
  const limit = Math.min(Math.max(slice.limit ?? 200, 1), MAX_TRANSCRIPT_LINES);
  const rows = await MaSegmentModel.find({
    meetingId: idOf(meeting),
    ...(slice.source ? { source: slice.source } : {}),
    ...(slice.afterMs === null || slice.afterMs === undefined
      ? {}
      : { startMs: { $gt: slice.afterMs } }),
  })
    .sort({ startMs: 1, stream: 1, index: 1 })
    .limit(limit)
    .lean();
  return rows.map((row) => {
    const name = confirmedSpeaker(meeting, row.speakerLabel ?? null);
    return { ...row, id: idOf(row), speakerName: name, speakerConfirmed: name !== null };
  });
}

export async function transcriptSearch(input: TableQueryInput, scope: Scope) {
  const ids = await meetingIdsIn(scope);
  const page = await tableQuery(
    MaSegmentModel,
    input,
    TRANSCRIPT_TABLE,
    ids ? { meetingId: { $in: ids } } : {},
  );
  const rows = page.rows as Array<{ _id: unknown; meetingId: string }>;
  const facts = await meetingFacts(rows.map((row) => row.meetingId));
  return {
    totalCount: page.totalCount,
    rows: rows.map((row) => ({
      ...row,
      id: idOf(row),
      meetingTitle: facts.get(row.meetingId)?.title ?? '',
      meetingStartedAt: facts.get(row.meetingId)?.startedAt ?? new Date(0),
    })),
  };
}

/** The log, confined like meetings: the whole company, or events the caller may see. */
export async function eventsPage(input: TableQueryInput, scope: Scope, meetingId?: string | null) {
  const filter = { ...scope, ...(meetingId ? { meetingId } : {}) };
  const page = await tableQuery(MaEventModel, input, EVENTS_TABLE, filter);
  return {
    totalCount: page.totalCount,
    rows: (page.rows as Array<{ _id: unknown }>).map((row) => ({ ...row, id: idOf(row) })),
  };
}
