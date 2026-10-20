import {
  MAX_PARTICIPANT_EVENTS,
  participantKey,
  recordParticipantEvents,
  recordSelf,
  replaceWithOfficial,
  type ParticipantEvent,
} from '../../../../src/modules/meeting-assistant/participants.service';
import { MaParticipantModel } from '../../../../src/modules/meeting-assistant/models';
import { actorNamed } from './ma.fixtures';

const MEETING = 'meeting-1';
const T0 = new Date('2026-10-20T10:00:00.000Z');
const at = (seconds: number) => new Date(T0.getTime() + seconds * 1000);

const actor = actorNamed('Kiran');

const event = (
  displayName: string,
  kind: ParticipantEvent['event'],
  seconds: number,
  isSelf = false,
): ParticipantEvent => ({ key: '', displayName, event: kind, at: at(seconds), isSelf });

const rowOf = (key: string) => MaParticipantModel.findOne({ meetingId: MEETING, key }).lean();

beforeAll(async () => {
  await MaParticipantModel.init();
});

describe('participantKey', () => {
  it('treats case and spacing differences as the same person', () => {
    expect(participantKey('  Priya   Shah ')).toBe('ui:priya shah');
    expect(participantKey('PRIYA SHAH')).toBe(participantKey('priya shah'));
  });
});

describe('join and leave events', () => {
  it('totals attendance and counts a rejoin, applying events in time order', async () => {
    const applied = await recordParticipantEvents(MEETING, actor, [
      event('Priya', 'LEFT', 300),
      event('Priya', 'JOINED', 0),
      event('Priya', 'JOINED', 400),
      event('Priya', 'LEFT', 460),
    ]);

    expect(applied).toBe(4);
    const row = await rowOf('ui:priya');
    expect(row).toMatchObject({
      status: 'LEFT',
      source: 'MEET_UI',
      confidence: 0.6,
      email: null,
      userId: null,
      rejoinCount: 1,
      totalSeconds: 360,
    });
    expect(row?.sessions).toHaveLength(2);
  });

  it('ignores a second join while already in, and a leave while already out', async () => {
    await recordParticipantEvents(MEETING, actor, [
      event('Dev', 'JOINED', 0),
      event('Dev', 'JOINED', 10),
      event('Dev', 'LEFT', 60),
      event('Dev', 'LEFT', 90),
    ]);

    const row = await rowOf('ui:dev');
    expect(row).toMatchObject({ rejoinCount: 0, totalSeconds: 60, status: 'LEFT' });
    expect(row?.sessions).toHaveLength(1);
  });

  it('never counts negative time for a leave stamped before the join', async () => {
    await recordParticipantEvents(MEETING, actor, [event('Dev', 'JOINED', 100)]);
    await recordParticipantEvents(MEETING, actor, [event('Dev', 'LEFT', 50)]);

    expect((await rowOf('ui:dev'))?.totalSeconds).toBe(0);
  });

  it('marks an unknown state without inventing a join', async () => {
    await recordParticipantEvents(MEETING, actor, [event('Ola', 'UNKNOWN', 0)]);

    expect(await rowOf('ui:ola')).toMatchObject({ status: 'UNKNOWN', sessions: [] });
  });

  it('skips blank names and caps one request at the event limit', async () => {
    const many = Array.from({ length: MAX_PARTICIPANT_EVENTS + 10 }, (_, n) =>
      event(`Guest ${n}`, 'JOINED', n),
    );

    expect(await recordParticipantEvents(MEETING, actor, [event('   ', 'JOINED', 0)])).toBe(0);
    expect(await recordParticipantEvents(MEETING, actor, many)).toBe(MAX_PARTICIPANT_EVENTS);
    expect(await MaParticipantModel.countDocuments({ meetingId: MEETING })).toBe(
      MAX_PARTICIPANT_EVENTS,
    );
    expect(await rowOf(`ui:guest ${MAX_PARTICIPANT_EVENTS}`)).toBeNull();
  });

  it('keeps the signed-in user on their verified row, whatever name the page showed', async () => {
    await recordSelf(MEETING, actor, at(0));
    await recordParticipantEvents(MEETING, actor, [
      event('Kiran (You)', 'LEFT', 120, true),
      event('Kiran (You)', 'JOINED', 180, true),
    ]);

    const row = await rowOf(`user:${actor.id}`);
    expect(row).toMatchObject({
      displayName: 'Kiran',
      email: actor.email,
      userId: actor.id,
      source: 'EXTENSION_USER',
      confidence: 1,
      status: 'JOINED',
      rejoinCount: 1,
      totalSeconds: 120,
    });
    expect(await MaParticipantModel.countDocuments({ meetingId: MEETING })).toBe(1);
  });

  it('never lets what the page showed override Google’s official record', async () => {
    await replaceWithOfficial(MEETING, [
      { key: 'ui:priya', displayName: 'Priya', sessions: [{ joinedAt: at(0), leftAt: at(600) }] },
    ]);

    const applied = await recordParticipantEvents(MEETING, actor, [event('Priya', 'JOINED', 700)]);

    expect(applied).toBe(0);
    expect(await rowOf('ui:priya')).toMatchObject({
      source: 'GOOGLE_MEET_API',
      status: 'LEFT',
      totalSeconds: 600,
    });
  });
});

describe('replacing with the official list', () => {
  it('swaps the page’s rows for Google’s and keeps the signed-in user’s own row', async () => {
    await recordSelf(MEETING, actor, at(0));
    await recordParticipantEvents(MEETING, actor, [event('Guest', 'JOINED', 5)]);

    await replaceWithOfficial(MEETING, [
      {
        key: 'meet:conferenceRecords/1/participants/2',
        displayName: 'Asha Rao',
        sessions: [
          { joinedAt: at(400), leftAt: null },
          { joinedAt: at(0), leftAt: at(300) },
        ],
      },
    ]);

    const rows = await MaParticipantModel.find({ meetingId: MEETING }).sort({ key: 1 }).lean();
    expect(rows.map((row) => [row.key, row.source])).toEqual([
      ['meet:conferenceRecords/1/participants/2', 'GOOGLE_MEET_API'],
      [`user:${actor.id}`, 'EXTENSION_USER'],
    ]);
    expect(rows[0]).toMatchObject({ rejoinCount: 1, totalSeconds: 300, status: 'UNKNOWN' });
    expect(rows[0].sessions[0].joinedAt).toEqual(at(0));
  });

  it('removes earlier rows even when Google reports nobody', async () => {
    await recordParticipantEvents(MEETING, actor, [event('Guest', 'JOINED', 5)]);

    await replaceWithOfficial(MEETING, []);

    expect(await MaParticipantModel.countDocuments({ meetingId: MEETING })).toBe(0);
  });
});
