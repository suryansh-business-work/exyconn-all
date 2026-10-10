import { Types } from 'mongoose';
import {
  listSessions,
  revokeAllSessions,
  revokeOtherSessions,
  revokeSession,
  sessionIsLive,
  startSession,
} from '../../src/modules/auth/session.service';
import { SessionModel } from '../../src/modules/auth/session.model';

const USER = 'user-1';
const FIVE_MINUTES = 5 * 60 * 1000;

const begin = (userAgent = 'Firefox on Linux', userId = USER) =>
  startSession({ userId, userAgent, ip: '198.51.100.4' });

describe('starting a session', () => {
  it('records the device and keeps only the start of a very long user agent', async () => {
    const id = await begin('x'.repeat(500));

    const row = await SessionModel.findById(id).lean();
    expect(row?.userAgent).toHaveLength(200);
    expect(row).toMatchObject({ userId: USER, ip: '198.51.100.4', revokedAt: null });
  });
});

describe('whether a session still stands', () => {
  it('is false for a session that never existed', async () => {
    await expect(sessionIsLive(new Types.ObjectId().toHexString())).resolves.toBe(false);
  });

  it('is false once the session has been revoked', async () => {
    const id = await begin();
    await revokeSession(USER, id);

    await expect(sessionIsLive(id)).resolves.toBe(false);
  });

  it('leaves a recently seen session untouched', async () => {
    const id = await begin();
    const before = (await SessionModel.findById(id).lean())?.lastSeenAt;

    await expect(sessionIsLive(id)).resolves.toBe(true);

    const after = (await SessionModel.findById(id).lean())?.lastSeenAt;
    expect(after?.getTime()).toBe(before?.getTime());
  });

  it('touches last seen once it has gone stale', async () => {
    const id = await begin();
    const stale = new Date(Date.now() - FIVE_MINUTES - 60_000);
    await SessionModel.updateOne({ _id: id }, { $set: { lastSeenAt: stale } });

    await expect(sessionIsLive(id)).resolves.toBe(true);

    const after = (await SessionModel.findById(id).lean())?.lastSeenAt;
    expect((after ?? new Date(0)).getTime()).toBeGreaterThan(stale.getTime() + FIVE_MINUTES);
  });
});

describe('listing sessions', () => {
  it('shows only live ones, and marks none current without a session id', async () => {
    const kept = await begin('Safari');
    const ended = await begin('Edge');
    await begin('Other person', 'user-2');
    await revokeSession(USER, ended);

    const sessions = await listSessions(USER, undefined);

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ id: kept, userAgent: 'Safari', current: false });
  });
});

describe('ending sessions', () => {
  it('refuses to end a session that belongs to somebody else', async () => {
    const theirs = await begin('Chrome', 'user-2');

    await expect(revokeSession(USER, theirs)).rejects.toThrow('Session not found');
    await expect(sessionIsLive(theirs)).resolves.toBe(true);
  });

  it('refuses to end a session twice', async () => {
    const id = await begin();
    await expect(revokeSession(USER, id)).resolves.toBe(true);

    await expect(revokeSession(USER, id)).rejects.toThrow('Session not found');
  });

  it('ends every other session and keeps the one asking', async () => {
    const current = await begin('Laptop');
    await begin('Phone');
    await begin('Tablet');

    await expect(revokeOtherSessions(USER, current)).resolves.toBe(2);

    const left = await listSessions(USER, current);
    expect(left).toEqual([expect.objectContaining({ id: current, current: true })]);
  });

  it('ends every session when the caller has no session id of its own', async () => {
    await begin('Laptop');
    await begin('Phone');

    await expect(revokeOtherSessions(USER, undefined)).resolves.toBe(2);
    expect(await listSessions(USER, undefined)).toEqual([]);
  });

  it('ends all of one person s sessions, and nobody else s', async () => {
    await begin('Laptop');
    await begin('Phone');
    const other = await begin('Chrome', 'user-2');

    await revokeAllSessions(USER);

    expect(await listSessions(USER, undefined)).toEqual([]);
    await expect(sessionIsLive(other)).resolves.toBe(true);
  });
});
