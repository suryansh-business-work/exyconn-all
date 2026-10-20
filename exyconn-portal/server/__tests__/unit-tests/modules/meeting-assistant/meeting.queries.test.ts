import {
  maMeetingMutations,
  maMeetingQueries,
} from '../../../../src/modules/meeting-assistant/ma.meeting.resolvers';
import {
  durationSeconds,
  meetingParticipants,
  presentMeetings,
} from '../../../../src/modules/meeting-assistant/meeting.queries';
import {
  MaActionItemModel,
  MaEventModel,
  MaMeetingModel,
  MaParticipantModel,
  MaSegmentModel,
} from '../../../../src/modules/meeting-assistant/models';
import { ROLES } from '../../../../src/constants/roles';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { ctxOf, PAGE, seedAccount, seedMeeting, type LeanMeeting } from './ma.fixtures';

let owner: MaActor;
let other: MaActor;
let asOwner: GraphQLContext;
let asAi: GraphQLContext;

const NOW = new Date();
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

const line = (meeting: LeanMeeting, startMs: number, text: string, speakerLabel: string | null) =>
  MaSegmentModel.create({
    meetingId: String(meeting._id),
    source: 'AI',
    stream: 'TAB',
    chunkSeq: startMs,
    index: 0,
    startMs,
    endMs: startMs + 500,
    text,
    speakerLabel,
  });

const attendee = (meeting: LeanMeeting, displayName: string, userId: string | null = null) =>
  MaParticipantModel.create({
    meetingId: String(meeting._id),
    key: `ui:${displayName}`,
    displayName,
    userId,
    source: 'MEET_UI',
  });

beforeEach(async () => {
  owner = await seedAccount('Asha', [ROLES.EMPLOYEE]);
  other = await seedAccount('Ravi', [ROLES.EMPLOYEE]);
  asOwner = ctxOf(owner, [ROLES.EMPLOYEE]);
  asAi = ctxOf(other, [ROLES.AI]);
});

describe('durationSeconds', () => {
  it('measures to the end, or to now while the call is live, never below zero', () => {
    const startedAt = new Date('2026-10-20T10:00:00Z');

    expect(durationSeconds({ startedAt, endedAt: new Date('2026-10-20T10:30:00Z') })).toBe(1800);
    expect(durationSeconds({ startedAt, endedAt: null }, startedAt.getTime() + 5000)).toBe(5);
    expect(durationSeconds({ startedAt, endedAt: new Date('2026-10-20T09:00:00Z') })).toBe(0);
  });
});

describe('the dashboard', () => {
  it('adds up the meetings in scope and their action items', async () => {
    const first = await seedMeeting(owner, {
      startedAt: daysAgo(2),
      endedAt: new Date(daysAgo(2).getTime() + 3_600_000),
      status: 'ENDED',
      summaryStatus: 'READY',
      transcriptionFailures: 2,
      costUsd: 0.5,
      language: 'HINDI',
    });
    await seedMeeting(owner, { meetingCode: 'xyz-wxyz-xyz', startedAt: daysAgo(1) });
    await seedMeeting(other, { meetingCode: 'klm-nopq-rst' });
    await MaActionItemModel.create([
      { meetingId: String(first._id), title: 'Open', createdById: 's', dueDate: daysAgo(1) },
      { meetingId: String(first._id), title: 'Done', createdById: 's', status: 'COMPLETED' },
    ]);

    const mine = await maMeetingQueries.maDashboard(null, {}, asOwner);

    expect(mine).toMatchObject({
      totalMeetings: 2,
      notesGenerated: 1,
      pendingActions: 1,
      completedActions: 1,
      overdueActions: 1,
      transcriptionFailures: 2,
      costUsd: 0.5,
    });
    expect(mine.totalDurationSeconds).toBeGreaterThanOrEqual(3600);
    // Ties have no defined order, so only the set is checked.
    expect(mine.byLanguage).toHaveLength(2);
    expect(mine.byLanguage).toEqual(
      expect.arrayContaining([
        { value: 'AUTO', count: 1 },
        { value: 'HINDI', count: 1 },
      ]),
    );
    expect(mine.byDay.reduce((sum, day) => sum + day.count, 0)).toBe(2);
    expect(
      (await maMeetingQueries.maDashboard(null, { filter: { scope: 'ALL' } }, asAi)).totalMeetings,
    ).toBe(3);
  });

  it('narrows by date, owner, status, language and attendee', async () => {
    const attended = await seedMeeting(owner, {
      status: 'ENDED',
      language: 'ENGLISH',
      startedAt: daysAgo(3),
    });
    await seedMeeting(owner, { meetingCode: 'xyz-wxyz-xyz', startedAt: daysAgo(40) });
    await attendee(attended, 'Ravi', other.id);
    const all = (filter: Record<string, unknown>) =>
      maMeetingQueries.maDashboard(null, { filter: { scope: 'ALL', ...filter } }, asAi);

    expect((await all({ from: daysAgo(10), to: NOW })).totalMeetings).toBe(1);
    expect(
      (await all({ ownerId: owner.id, status: 'ENDED', language: 'ENGLISH' })).totalMeetings,
    ).toBe(1);
    expect((await all({ participantUserId: other.id })).totalMeetings).toBe(1);
    expect((await all({ participantUserId: owner.id })).totalMeetings).toBe(0);
  });

  it('narrows by a start or an end alone', async () => {
    await seedMeeting(owner, { startedAt: daysAgo(3) });
    const all = (filter: Record<string, unknown>) =>
      maMeetingQueries.maDashboard(null, { filter: { scope: 'ALL', ...filter } }, asAi);

    expect((await all({ from: daysAgo(1) })).totalMeetings).toBe(0);
    expect((await all({ to: daysAgo(1) })).totalMeetings).toBe(1);
  });

  it('reports zeros, not errors, when nothing matches', async () => {
    expect(await maMeetingQueries.maDashboard(null, {}, asOwner)).toMatchObject({
      totalMeetings: 0,
      totalDurationSeconds: 0,
      costUsd: 0,
      byLanguage: [],
    });
  });
});

describe('reading a meeting', () => {
  it('returns the transcript in order with confirmed names, sliced and filtered', async () => {
    const meeting = await seedMeeting(owner, {
      speakerMappings: [
        { label: 'Speaker A', name: 'Neha', confirmedById: owner.id, confirmedAt: NOW },
      ],
    });
    await line(meeting, 2000, 'second', 'Speaker B');
    await line(meeting, 1000, 'first', 'Speaker A');
    const read = (slice: Record<string, unknown>) =>
      maMeetingQueries.maTranscript(null, { meetingId: String(meeting._id), ...slice }, asOwner);

    const all = await read({});
    expect(all.map((row) => [row.text, row.speakerName, row.speakerConfirmed])).toEqual([
      ['first', 'Neha', true],
      ['second', null, false],
    ]);
    expect((await read({ afterMs: 1000 })).map((row) => row.text)).toEqual(['second']);
    expect(await read({ limit: 0, source: 'AI' })).toHaveLength(1);
    expect(await read({ source: 'GOOGLE_MEET' })).toHaveLength(0);
  });

  it('searches transcripts and lists participants only within the caller’s meetings', async () => {
    const mine = await seedMeeting(owner, { title: 'Mine' });
    const theirs = await seedMeeting(other, { title: 'Theirs' });
    await line(mine, 0, 'budget talk', null);
    await line(theirs, 0, 'budget secret', null);
    await attendee(mine, 'Priya');
    await attendee(theirs, 'Karan');

    const search = await maMeetingQueries.maTranscriptSearch(
      null,
      { input: { ...PAGE, search: 'budget' } },
      asOwner,
    );
    const everyone = await maMeetingQueries.maParticipantsPaged(
      null,
      { input: PAGE, scope: 'ALL' },
      asAi,
    );
    const people = await maMeetingQueries.maParticipantsPaged(null, { input: PAGE }, asOwner);

    expect(search.rows.map((row) => [(row as { text?: string }).text, row.meetingTitle])).toEqual([
      ['budget talk', 'Mine'],
    ]);
    expect(
      people.rows.map((row) => [(row as { displayName?: string }).displayName, row.meetingTitle]),
    ).toEqual([['Priya', 'Mine']]);
    expect(everyone.totalCount).toBe(2);
    expect(
      (await maMeetingQueries.maParticipants(null, { meetingId: String(mine._id) }, asOwner)).map(
        (row) => row.displayName,
      ),
    ).toEqual(['Priya']);
    expect(
      await codeOf(
        maMeetingQueries.maParticipants(null, { meetingId: String(theirs._id) }, asOwner),
      ),
    ).toBe('NOT_FOUND');
  });

  it('keeps lines and people of a deleted meeting in the company view, untitled', async () => {
    const gone = await seedMeeting(owner);
    await line(gone, 0, 'orphan line', null);
    await attendee(gone, 'Orphan');
    await MaMeetingModel.deleteOne({ _id: gone._id });

    const search = await maMeetingQueries.maTranscriptSearch(
      null,
      { input: PAGE, scope: 'ALL' },
      asAi,
    );
    const people = await maMeetingQueries.maParticipantsPaged(
      null,
      { input: PAGE, scope: 'ALL' },
      asAi,
    );

    expect(search.rows.map((row) => [row.meetingTitle, row.meetingStartedAt])).toEqual([
      ['', new Date(0)],
    ]);
    expect(people.rows.map((row) => row.meetingTitle)).toEqual(['']);
    expect(await meetingParticipants(String(gone._id))).toEqual([
      expect.objectContaining({
        displayName: 'Orphan',
        meetingTitle: '',
        meetingStartedAt: new Date(0),
      }),
    ]);
  });

  it('presents a row saved before recordings were counted as having none', async () => {
    const meeting = await seedMeeting(owner);

    const [shown] = await presentMeetings([{ ...meeting, recordingSeconds: undefined as never }]);

    expect(shown).toMatchObject({ recordingSeconds: 0, actionItemCount: 0, openActionCount: 0 });
  });

  it('shows a meeting’s log to its viewers and the caller’s own events otherwise', async () => {
    const meeting = await seedMeeting(owner);
    await MaEventModel.create([
      { meetingId: String(meeting._id), viewerIds: [owner.id], type: 'A', message: 'mine' },
      { meetingId: null, viewerIds: [other.id], type: 'B', message: 'theirs' },
    ]);

    const forMeeting = await maMeetingQueries.maEventsPaged(
      null,
      { input: PAGE, meetingId: String(meeting._id) },
      asOwner,
    );
    const own = await maMeetingQueries.maEventsPaged(null, { input: PAGE }, asOwner);

    expect(forMeeting.rows.map((row) => (row as { message?: string }).message)).toEqual(['mine']);
    expect(own.totalCount).toBe(1);
    expect(
      await maMeetingQueries.maMeeting(null, { id: String(meeting._id) }, asOwner),
    ).toMatchObject({
      id: String(meeting._id),
    });
  });
});

describe('changing a meeting from the extension and the portal', () => {
  it('renames it and logs the change', async () => {
    const meeting = await seedMeeting(owner);

    const renamed = await maMeetingMutations.maUpdateMeeting(
      null,
      { id: String(meeting._id), input: { title: '  Board review  ', language: 'HINGLISH' } },
      asOwner,
    );

    expect(renamed).toMatchObject({ title: 'Board review', language: 'HINGLISH' });
    expect(await MaEventModel.countDocuments({ type: 'MEETING_UPDATED' })).toBe(1);
  });

  it('records consent, capture changes and participant events on the caller’s own session', async () => {
    const meeting = await seedMeeting(owner);
    const meetingId = String(meeting._id);
    const beat = (captureState: 'RECORDING' | 'PAUSED') =>
      maMeetingMutations.maHeartbeat(
        null,
        { meetingId, input: { transcriptionState: 'UNKNOWN', captureState, participantCount: 2 } },
        asOwner,
      );

    const consented = await maMeetingMutations.maRecordConsent(null, { meetingId }, asOwner);
    await beat('RECORDING');
    await beat('RECORDING');
    const applied = await maMeetingMutations.maRecordParticipantEvents(
      null,
      {
        meetingId,
        events: [{ key: '', displayName: 'Priya', event: 'JOINED', at: NOW, isSelf: false }],
      },
      asOwner,
    );

    expect(consented.consentRecordedAt).toBeInstanceOf(Date);
    expect(await MaEventModel.countDocuments({ type: 'CAPTURE_STATE' })).toBe(1);
    expect(applied).toBe(1);
    expect(await codeOf(maMeetingMutations.maRecordConsent(null, { meetingId }, asAi))).toBe(
      'NOT_FOUND',
    );
  });
});
