import { SessionModel } from './session.model';
import { runAsPlatform } from '../../lib/tenant';
import { notFound } from '../../utils/errors';

/**
 * How stale "last seen" is allowed to get. Writing on every request would turn a read-only
 * query into a write; five minutes is precise enough for a human deciding whether a session
 * is still in use, and cheap enough to do on a request that was going to read the row anyway.
 */
const LAST_SEEN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Sessions are read and written as the platform, like the sign-in that creates them: a
 * session is a fact about a person, and it has to be resolvable before the request has a
 * company scope at all.
 */
export async function startSession(input: {
  userId: string;
  userAgent: string;
  ip: string;
}): Promise<string> {
  const session = await runAsPlatform(() =>
    SessionModel.create({
      userId: input.userId,
      // Long user-agent strings are a fingerprint, not information; the list only needs
      // enough to recognise the device.
      userAgent: input.userAgent.slice(0, 200),
      ip: input.ip,
      lastSeenAt: new Date(),
    }),
  );
  return String(session._id);
}

/** Whether this session still stands, touching `lastSeenAt` when it has gone stale. */
export async function sessionIsLive(sessionId: string): Promise<boolean> {
  const session = await runAsPlatform(() =>
    SessionModel.findById(sessionId).select('revokedAt lastSeenAt').lean(),
  );
  if (!session || session.revokedAt) {
    return false;
  }
  if (Date.now() - session.lastSeenAt.getTime() > LAST_SEEN_INTERVAL_MS) {
    await runAsPlatform(() =>
      SessionModel.updateOne({ _id: sessionId }, { $set: { lastSeenAt: new Date() } }),
    );
  }
  return true;
}

/** Every session this person has, newest first, with the current one marked. */
export async function listSessions(userId: string, currentSessionId: string | undefined) {
  const rows = await runAsPlatform(() =>
    SessionModel.find({ userId, revokedAt: null }).sort({ createdAt: -1 }).lean(),
  );
  return rows.map((row) => ({
    id: String(row._id),
    userAgent: row.userAgent,
    ip: row.ip,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
    current: String(row._id) === currentSessionId,
  }));
}

/** Ends one session. Only ever called with the caller's own id as `userId`. */
export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  const result = await runAsPlatform(() =>
    SessionModel.updateOne(
      { _id: sessionId, userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    ),
  );
  if (result.matchedCount === 0) {
    notFound('Session');
  }
  return true;
}

/**
 * Ends every session except the one asking — the "sign out everywhere else" button somebody
 * presses when they think their password has been seen.
 */
export async function revokeOtherSessions(
  userId: string,
  currentSessionId: string | undefined,
): Promise<number> {
  const result = await runAsPlatform(() =>
    SessionModel.updateMany(
      { userId, revokedAt: null, _id: { $ne: currentSessionId ?? null } },
      { $set: { revokedAt: new Date() } },
    ),
  );
  return result.modifiedCount;
}

/** Ends every session a person has. Called when their password is set by anybody. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await runAsPlatform(() =>
    SessionModel.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } }),
  );
}
