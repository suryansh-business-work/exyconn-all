import { UserModel } from '../admin/user.model';
import {
  TrackerIntervalModel,
  TrackerManualEntryModel,
  TrackerScreenshotModel,
  TrackerSessionModel,
} from './models';

/** One person's time on one ticket (or on no ticket) within a project. */
export interface TimeLogRow {
  /** `userId:taskId` — the pair this row aggregates, and its identity in the grid. */
  id: string;
  userId: string;
  userName: string;
  /** Empty when the time was booked to the project without picking a ticket. */
  taskId: string;
  taskKey: string;
  taskTitle: string;
  /** Measured, from tracked intervals. */
  activeMs: number;
  idleMs: number;
  /** Approved off-computer time claimed against the same ticket. */
  manualMs: number;
  sessions: number;
  screenshots: number;
}

/** One tracked run, for the drill-down under a row. */
export interface TimeLogSession {
  id: string;
  userId: string;
  userName: string;
  taskKey: string;
  taskTitle: string;
  startedAt: Date;
  endedAt: Date | null;
  activeMs: number;
  idleMs: number;
  screenshotCount: number;
}

/** A session's screenshots, only ever returned to a caller allowed to see them. */
export interface TimeLogScreenshot {
  id: string;
  capturedAt: Date;
  imageUrl: string;
  blurred: boolean;
}

/** The grouping key a row aggregates on. */
const rowKey = (userId: string, taskId: string): string => `${userId}:${taskId}`;

/**
 * A project's time log: who worked on which ticket, for how long, with what evidence.
 *
 * Sessions carry the project and the ticket; intervals carry the time. So the totals are
 * summed from the INTERVALS of the project's sessions rather than from the sessions' own
 * roll-ups — a session that is still running has not rolled up yet, and a report that
 * silently omitted today's work would be read as "nobody worked on this".
 */
class TrackerTimeLogService {
  /** The project's sessions in a window, which everything else here hangs off. */
  private sessionsIn(projectId: string, from: Date, to: Date) {
    return TrackerSessionModel.find({ projectId, startedAt: { $gte: from, $lt: to } })
      .select('userId taskId taskKey taskTitle startedAt endedAt')
      .lean();
  }

  /**
   * Per-person, per-ticket totals for a project.
   *
   * Three sources are merged on the same (user, ticket) key: interval time, screenshot
   * counts, and approved off-computer claims. A person whose only contribution was an
   * approved meeting still gets a row — leaving them out would under-report the ticket.
   */
  async summary(projectId: string, from: Date, to: Date): Promise<TimeLogRow[]> {
    const sessions = await this.sessionsIn(projectId, from, to);
    const manual = await TrackerManualEntryModel.find({
      projectId,
      status: 'APPROVED',
      startedAt: { $gte: from, $lt: to },
    })
      .select('userId taskId taskKey taskTitle durationMs')
      .lean();

    const rows = new Map<string, TimeLogRow>();
    const blank = (userId: string, taskId: string, key: string, title: string): TimeLogRow => ({
      id: rowKey(userId, taskId),
      userId,
      userName: '',
      taskId,
      taskKey: key,
      taskTitle: title,
      activeMs: 0,
      idleMs: 0,
      manualMs: 0,
      sessions: 0,
      screenshots: 0,
    });

    // Which row each session belongs to, so interval and screenshot totals can be attributed
    // without re-reading the session for every one of them.
    const rowOfSession = new Map<string, string>();
    for (const session of sessions) {
      const key = rowKey(session.userId, session.taskId ?? '');
      rowOfSession.set(String(session._id), key);
      const row =
        rows.get(key) ??
        blank(session.userId, session.taskId ?? '', session.taskKey ?? '', session.taskTitle ?? '');
      row.sessions += 1;
      rows.set(key, row);
    }

    if (sessions.length > 0) {
      const sessionIds = sessions.map((session) => String(session._id));
      const [intervals, shots] = await Promise.all([
        TrackerIntervalModel.aggregate<{ _id: string; activeMs: number; idleMs: number }>([
          { $match: { sessionId: { $in: sessionIds } } },
          {
            $group: {
              _id: '$sessionId',
              activeMs: { $sum: '$activeMs' },
              idleMs: { $sum: '$idleMs' },
            },
          },
        ]),
        TrackerScreenshotModel.aggregate<{ _id: string; count: number }>([
          { $match: { sessionId: { $in: sessionIds } } },
          { $group: { _id: '$sessionId', count: { $sum: 1 } } },
        ]),
      ]);

      for (const entry of intervals) {
        const row = rows.get(rowOfSession.get(entry._id) ?? '');
        if (row) {
          row.activeMs += entry.activeMs;
          row.idleMs += entry.idleMs;
        }
      }
      for (const entry of shots) {
        const row = rows.get(rowOfSession.get(entry._id) ?? '');
        if (row) {
          row.screenshots += entry.count;
        }
      }
    }

    for (const entry of manual) {
      const key = rowKey(entry.userId, entry.taskId ?? '');
      const row =
        rows.get(key) ??
        blank(entry.userId, entry.taskId ?? '', entry.taskKey ?? '', entry.taskTitle ?? '');
      row.manualMs += entry.durationMs;
      rows.set(key, row);
    }

    return this.named([...rows.values()]).then((named) =>
      named.sort((a, b) => b.activeMs + b.manualMs - (a.activeMs + a.manualMs)),
    );
  }

  /** Fills in employee names in one query, whatever the rows turned out to be. */
  private async named(rows: TimeLogRow[]): Promise<TimeLogRow[]> {
    if (rows.length === 0) {
      return rows;
    }
    const userIds = [...new Set(rows.map((row) => row.userId))];
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select('name')
      .lean();
    const nameOf = new Map(users.map((user) => [String(user._id), user.name]));
    // An account deleted since the work was done still has hours on the project's books.
    return rows.map((row) => ({ ...row, userName: nameOf.get(row.userId) ?? 'Deleted employee' }));
  }

  /** The individual runs behind one row, newest first. */
  async sessions(
    projectId: string,
    from: Date,
    to: Date,
    userId?: string | null,
    taskId?: string | null,
  ): Promise<TimeLogSession[]> {
    const filter: Record<string, unknown> = { projectId, startedAt: { $gte: from, $lt: to } };
    if (userId) {
      filter.userId = userId;
    }
    // '' is a real filter value here — "time booked to no ticket" is a row people drill into.
    if (taskId !== undefined && taskId !== null) {
      filter.taskId = taskId;
    }

    const sessions = await TrackerSessionModel.find(filter)
      .sort({ startedAt: -1 })
      .limit(200)
      .lean();
    if (sessions.length === 0) {
      return [];
    }

    const sessionIds = sessions.map((session) => String(session._id));
    const [intervals, shots, users] = await Promise.all([
      TrackerIntervalModel.aggregate<{ _id: string; activeMs: number; idleMs: number }>([
        { $match: { sessionId: { $in: sessionIds } } },
        {
          $group: {
            _id: '$sessionId',
            activeMs: { $sum: '$activeMs' },
            idleMs: { $sum: '$idleMs' },
          },
        },
      ]),
      TrackerScreenshotModel.aggregate<{ _id: string; count: number }>([
        { $match: { sessionId: { $in: sessionIds } } },
        { $group: { _id: '$sessionId', count: { $sum: 1 } } },
      ]),
      UserModel.find({ _id: { $in: [...new Set(sessions.map((s) => s.userId))] } })
        .select('name')
        .lean(),
    ]);

    const timeOf = new Map(intervals.map((entry) => [entry._id, entry]));
    const shotsOf = new Map(shots.map((entry) => [entry._id, entry.count]));
    const nameOf = new Map(users.map((user) => [String(user._id), user.name]));

    return sessions.map((session) => {
      const id = String(session._id);
      return {
        id,
        userId: session.userId,
        userName: nameOf.get(session.userId) ?? 'Deleted employee',
        taskKey: session.taskKey ?? '',
        taskTitle: session.taskTitle ?? '',
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? null,
        activeMs: timeOf.get(id)?.activeMs ?? 0,
        idleMs: timeOf.get(id)?.idleMs ?? 0,
        screenshotCount: shotsOf.get(id) ?? 0,
      };
    });
  }

  /**
   * The screenshots captured during one session of this project.
   *
   * Scoped by projectId as well as by session so a caller cannot read the screenshots of a
   * session belonging to a project they were not authorised against — the session id alone
   * would be an unguarded handle on any employee's screen.
   */
  async screenshots(projectId: string, sessionId: string): Promise<TimeLogScreenshot[]> {
    const session = await TrackerSessionModel.findOne({ _id: sessionId, projectId })
      .select('_id')
      .lean();
    if (!session) {
      return [];
    }
    const shots = await TrackerScreenshotModel.find({ sessionId })
      .select('capturedAt imageUrl blurred')
      .sort({ capturedAt: 1 })
      .lean();
    return shots.map((shot) => ({
      id: String(shot._id),
      capturedAt: shot.capturedAt,
      imageUrl: shot.imageUrl,
      blurred: shot.blurred,
    }));
  }
}

export const trackerTimeLogService = new TrackerTimeLogService();
