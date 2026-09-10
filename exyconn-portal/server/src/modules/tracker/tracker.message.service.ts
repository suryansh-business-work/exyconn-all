import { UserModel } from '../admin/user.model';
import { badRequest } from '../../utils/errors';
import { TrackerAccessModel, TrackerMessageModel, type TrackerMessageDocument } from './models';
import {
  TRACKER_MESSAGE_LIMITS,
  type TrackerMessageDirection,
  type TrackerMessageKind,
} from './tracker.constants';

/** A message as `.lean()` returns it. */
type MessageLean = TrackerMessageDocument & { _id: unknown };

/** What an administrator pushes out to one, several, or every tracked employee. */
export interface NoticeInput {
  title: string;
  body: string;
  /** Empty means every employee with an active tracker grant. */
  userIds?: string[] | null;
}

/** One employee's conversation, as the portal's inbox lists it. */
export interface MessageThreadSummary {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessageAt: Date | null;
  lastMessageBody: string;
  /** Messages from this employee that nobody has read yet. */
  unread: number;
}

/** Rejects an empty or oversized message before it reaches the database. */
function cleanBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed === '') {
    badRequest('A message cannot be empty.');
  }
  if (trimmed.length > TRACKER_MESSAGE_LIMITS.maxBodyChars) {
    badRequest(
      `A message cannot be longer than ${TRACKER_MESSAGE_LIMITS.maxBodyChars} characters.`,
    );
  }
  return trimmed;
}

/** Same, for a notice's subject line — which is required, unlike a chat line's. */
function cleanTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed === '') {
    badRequest('A notice needs a title.');
  }
  if (trimmed.length > TRACKER_MESSAGE_LIMITS.maxTitleChars) {
    badRequest(`A title cannot be longer than ${TRACKER_MESSAGE_LIMITS.maxTitleChars} characters.`);
  }
  return trimmed;
}

/**
 * The messages that travel between an employee's tracker and whoever administers it: the
 * two-way chat thread, and the announcements an administrator pushes out.
 *
 * Every read is scoped by a userId the caller has already proved they may see. The employee
 * side only ever passes the id its own device token authenticated as, so the desktop app
 * cannot ask for anybody else's conversation.
 */
class TrackerMessageService {
  /**
   * One employee's messages of a given kind, oldest first — the chat thread by default.
   *
   * Chat and notices are read separately rather than interleaved: an announcement pushed to
   * the whole company is not a turn in a conversation, and threading the two would make
   * every broadcast look like something the employee was personally written to about.
   */
  async thread(userId: string, kind: TrackerMessageKind = 'CHAT'): Promise<MessageLean[]> {
    const messages = await TrackerMessageModel.find({ userId, kind })
      .sort({ createdAt: -1 })
      .limit(TRACKER_MESSAGE_LIMITS.threadLimit)
      .lean();
    return messages.reverse();
  }

  /** Posts one line into an employee's thread, in the direction the caller is speaking. */
  async send(
    userId: string,
    direction: TrackerMessageDirection,
    body: string,
    authorId: string,
  ): Promise<MessageLean> {
    const created = await TrackerMessageModel.create({
      userId,
      kind: 'CHAT' as TrackerMessageKind,
      direction,
      body: cleanBody(body),
      authorId,
      authorName: await this.authorNameOf(authorId),
    });
    return created.toObject() as MessageLean;
  }

  /**
   * The author's name at the moment they wrote, stamped onto the message.
   *
   * Read from the account rather than taken from the caller — a client that could name its
   * own author could put anybody's name on a message — and denormalised rather than joined,
   * so a thread still says who spoke after that person has left.
   */
  private async authorNameOf(authorId: string): Promise<string> {
    const user = await UserModel.findById(authorId).select('name').lean();
    return user?.name ?? '';
  }

  /**
   * Pushes an announcement to every employee it names, or to everyone with an active grant.
   *
   * One row per recipient. It costs a write each, and it buys per-person read state — which
   * is the entire point of a notice: an administrator can see it actually landed, rather
   * than trusting that a single broadcast row was looked at.
   */
  async broadcast(input: NoticeInput, authorId: string): Promise<MessageLean[]> {
    const title = cleanTitle(input.title);
    const body = cleanBody(input.body);
    const [recipients, authorName] = await Promise.all([
      this.resolveRecipients(input.userIds),
      this.authorNameOf(authorId),
    ]);
    if (recipients.length === 0) {
      badRequest('Nobody has tracker access, so there is nobody to notify.');
    }

    const created = await TrackerMessageModel.insertMany(
      recipients.map((userId) => ({
        userId,
        kind: 'NOTICE' as TrackerMessageKind,
        direction: 'TO_EMPLOYEE' as TrackerMessageDirection,
        title,
        body,
        authorId,
        authorName,
      })),
    );
    return created.map((doc) => doc.toObject() as MessageLean);
  }

  /**
   * Who a notice actually reaches: the ids asked for, narrowed to employees whose tracker
   * access is still active. An announcement addressed to a revoked account is a row nobody
   * will ever open.
   */
  private async resolveRecipients(userIds?: string[] | null): Promise<string[]> {
    const filter = userIds?.length
      ? { isActive: true, userId: { $in: userIds } }
      : { isActive: true };
    const grants = await TrackerAccessModel.find(filter).select('userId').lean();
    return grants.map((grant) => grant.userId);
  }

  /**
   * The announcements this employee has not seen yet.
   *
   * The desktop app reads these on its keep-alive and raises each one as a desktop
   * notification, then marks them read — so a notice arrives while the app is in the tray,
   * which is where it is for most of the working day.
   */
  async pendingNotices(userId: string): Promise<MessageLean[]> {
    return TrackerMessageModel.find({
      userId,
      kind: 'NOTICE',
      direction: 'TO_EMPLOYEE',
      readAt: null,
    })
      .sort({ createdAt: 1 })
      .limit(TRACKER_MESSAGE_LIMITS.threadLimit)
      .lean();
  }

  /**
   * How many CHAT messages travelling in `direction` this employee's thread still holds
   * unread. Notices are excluded on purpose: they are counted and cleared by the desktop
   * app as it raises them, and folding them in would make an announcement look like an
   * unanswered message from a person.
   */
  async unreadCount(userId: string, direction: TrackerMessageDirection): Promise<number> {
    return TrackerMessageModel.countDocuments({ userId, kind: 'CHAT', direction, readAt: null });
  }

  /**
   * Marks everything travelling in one direction on this thread as read, and answers how
   * many that was. Whoever a message is going TO owns its read state, so an employee reading
   * their thread can never mark their own outbound line read on the administrator's behalf.
   */
  async markRead(
    userId: string,
    direction: TrackerMessageDirection,
    kind?: TrackerMessageKind,
  ): Promise<number> {
    const scope = kind ? { kind } : {};
    const result = await TrackerMessageModel.updateMany(
      { userId, direction, readAt: null, ...scope },
      { readAt: new Date() },
    );
    return result.modifiedCount;
  }

  /**
   * Every employee who has ever exchanged a message, newest conversation first, with the
   * unread count that tells an administrator where to look. Built from one aggregation and
   * one user lookup rather than a query per thread.
   */
  async threads(): Promise<MessageThreadSummary[]> {
    const rows = await TrackerMessageModel.aggregate<{
      _id: string;
      lastMessageAt: Date;
      lastMessageBody: string;
      unread: number;
    }>([
      { $match: { kind: 'CHAT' } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessageAt: { $first: '$createdAt' },
          lastMessageBody: { $first: '$body' },
          unread: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$direction', 'TO_ADMIN'] }, { $eq: ['$readAt', null] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    const users = await UserModel.find({ _id: { $in: rows.map((row) => row._id) } })
      .select('name email')
      .lean();
    const byId = new Map(users.map((user) => [String(user._id), user]));

    return rows.map((row) => ({
      userId: row._id,
      userName: byId.get(row._id)?.name ?? 'Unknown employee',
      userEmail: byId.get(row._id)?.email ?? '',
      lastMessageAt: row.lastMessageAt,
      lastMessageBody: row.lastMessageBody,
      unread: row.unread,
    }));
  }
}

export const trackerMessageService = new TrackerMessageService();
