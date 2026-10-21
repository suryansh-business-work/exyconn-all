import { MaParticipantModel, type MaParticipantDocument } from './models';
import type { ParticipantStatus } from './ma.enums';
import type { MaActor } from './ma.access';

/** The most participant events one request may carry. */
export const MAX_PARTICIPANT_EVENTS = 50;
/** How the visible Meet UI is trusted: better than nothing, short of the official API. */
const UI_CONFIDENCE = 0.6;
const SELF_KEY_PREFIX = 'user:';

export interface ParticipantEvent {
  key: string;
  displayName: string;
  event: ParticipantStatus;
  at: Date;
  isSelf: boolean;
}

type Attendance = { joinedAt: Date; leftAt?: Date | null };

/** A display name as one key: case, spacing and punctuation never make two people of one. */
export function participantKey(displayName: string): string {
  return `ui:${displayName.normalize('NFKC').trim().toLowerCase().replaceAll(/\s+/g, ' ')}`;
}

const secondsBetween = (from: Date, to: Date) =>
  Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));

/** Opens an attendance unless one is open; reopening a closed one counts as a rejoin. */
export function applyJoin(
  row: Pick<MaParticipantDocument, 'sessions' | 'rejoinCount' | 'status'>,
  at: Date,
) {
  const sessions = row.sessions as Attendance[];
  const last = sessions.at(-1);
  if (last && !last.leftAt) {
    return;
  }
  if (last) {
    row.rejoinCount += 1;
  }
  sessions.push({ joinedAt: at, leftAt: null });
  row.status = 'JOINED';
}

/** Closes the open attendance, adding its length to the total. */
export function applyLeave(
  row: Pick<MaParticipantDocument, 'sessions' | 'totalSeconds' | 'status'>,
  at: Date,
) {
  const open = (row.sessions as Attendance[]).at(-1);
  if (!open || open.leftAt) {
    return;
  }
  const leftAt = at < open.joinedAt ? open.joinedAt : at;
  open.leftAt = leftAt;
  row.totalSeconds += secondsBetween(open.joinedAt, leftAt);
  row.status = 'LEFT';
}

const DUPLICATE_KEY = 11000;

/** The signed-in extension user, whose identity (and email) the portal itself verified. */
export async function recordSelf(meetingId: string, actor: MaActor, at: Date): Promise<void> {
  try {
    await joinSelf(meetingId, actor, at);
  } catch (error) {
    if ((error as { code?: number }).code !== DUPLICATE_KEY) {
      throw error;
    }
    // Another tab of the same call inserted the row first: join that one instead.
    await joinSelf(meetingId, actor, at);
  }
}

async function joinSelf(meetingId: string, actor: MaActor, at: Date): Promise<void> {
  const key = `${SELF_KEY_PREFIX}${actor.id}`;
  const row =
    (await MaParticipantModel.findOne({ meetingId, key })) ??
    new MaParticipantModel({
      meetingId,
      key,
      displayName: actor.name,
      email: actor.email,
      userId: actor.id,
      source: 'EXTENSION_USER',
      confidence: 1,
    });
  applyJoin(row, at);
  await row.save();
}

/** The row an event belongs to: the signed-in user's own, or a display name's. */
const eventKey = (event: ParticipantEvent, actor: MaActor) =>
  event.isSelf ? `${SELF_KEY_PREFIX}${actor.id}` : participantKey(event.key || event.displayName);

/**
 * One person's events, in time order, against their row: read once, saved once. Returns how
 * many applied — none when the official Meet record already owns the row.
 */
async function applyEvents(
  meetingId: string,
  actor: MaActor,
  events: ParticipantEvent[],
): Promise<number> {
  const [first] = events;
  const key = eventKey(first, actor);
  const existing = await MaParticipantModel.findOne({ meetingId, key });
  if (existing?.source === 'GOOGLE_MEET_API') {
    // The official record outranks what the page showed.
    return 0;
  }
  const row =
    existing ??
    new MaParticipantModel({
      meetingId,
      key,
      displayName: first.isSelf ? actor.name : first.displayName.trim().slice(0, 200),
      email: first.isSelf ? actor.email : null,
      userId: first.isSelf ? actor.id : null,
      source: first.isSelf ? 'EXTENSION_USER' : 'MEET_UI',
      confidence: first.isSelf ? 1 : UI_CONFIDENCE,
    });
  for (const event of events) {
    if (event.event === 'JOINED') {
      applyJoin(row, event.at);
    } else if (event.event === 'LEFT') {
      applyLeave(row, event.at);
    } else {
      row.status = 'UNKNOWN';
    }
  }
  await row.save();
  return events.length;
}

/** Applies the extension's join/leave events in time order. Returns how many applied. */
export async function recordParticipantEvents(
  meetingId: string,
  actor: MaActor,
  events: ParticipantEvent[],
): Promise<number> {
  const ordered = events
    .slice(0, MAX_PARTICIPANT_EVENTS)
    .filter((event) => event.displayName.trim() !== '' || event.isSelf)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const byPerson = new Map<string, ParticipantEvent[]>();
  for (const event of ordered) {
    const key = eventKey(event, actor);
    byPerson.set(key, [...(byPerson.get(key) ?? []), event]);
  }
  const applied = await Promise.all(
    [...byPerson.values()].map((personEvents) => applyEvents(meetingId, actor, personEvents)),
  );
  return applied.reduce((sum, count) => sum + count, 0);
}

/** At the end of a call everyone still "in" leaves when it ended. */
export async function closeOpenAttendance(meetingId: string, endedAt: Date): Promise<void> {
  const open = await MaParticipantModel.find({ meetingId, status: 'JOINED' });
  await Promise.all(
    open.map((row) => {
      applyLeave(row, endedAt);
      return row.save();
    }),
  );
}

export interface OfficialParticipant {
  key: string;
  displayName: string;
  sessions: Array<{ joinedAt: Date; leftAt: Date | null }>;
}

/**
 * Replaces what the visible UI showed with Google's official participant list. The signed-in
 * user's own row (verified identity) stays; best-effort UI rows give way to the API's.
 */
export async function replaceWithOfficial(meetingId: string, official: OfficialParticipant[]) {
  await MaParticipantModel.deleteMany({
    meetingId,
    source: { $in: ['MEET_UI', 'GOOGLE_MEET_API'] },
  });
  const rows = official.map((person) => {
    const sessions = person.sessions
      .slice()
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
    const totalSeconds = sessions.reduce(
      (sum, session) =>
        sum + (session.leftAt ? secondsBetween(session.joinedAt, session.leftAt) : 0),
      0,
    );
    return {
      meetingId,
      key: person.key,
      displayName: person.displayName.slice(0, 200),
      source: 'GOOGLE_MEET_API',
      confidence: 1,
      sessions,
      rejoinCount: Math.max(0, sessions.length - 1),
      totalSeconds,
      status: sessions.at(-1)?.leftAt ? 'LEFT' : 'UNKNOWN',
    };
  });
  if (rows.length > 0) {
    await MaParticipantModel.insertMany(rows);
  }
}
