import { randomBytes } from 'node:crypto';
import { BoardColumnModel, TaskModel, TASK_VISIBILITIES } from './board.model';
import { ProjectModel } from './projects.model';
import { record, type Actor } from './board.service';
import { notifyShare } from './projects.notify';
import { UserModel } from '../admin/user.model';
import { ROLES } from '../../constants/roles';
import { badRequest, notFound } from '../../utils/errors';

/** Bytes of entropy behind a public ticket link. 32 bytes is 64 hex characters. */
const TOKEN_BYTES = 32;

/** The most people one Share sends a notice to. A bigger list is a broadcast, not a share. */
const MAX_RECIPIENTS = 50;

/** The longest note a share may carry. It is a line in a notification, not a message thread. */
const MAX_NOTE_LENGTH = 500;

export type TaskVisibility = (typeof TASK_VISIBILITIES)[number];

/**
 * What anybody holding a public ticket link may read: the ticket itself and where it stands.
 * Never its comments, history, attachments or anyone's id — a public link is read by people
 * outside the company, and the conversation underneath a ticket was written for colleagues.
 */
export interface PublicTaskView {
  key: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  isDone: boolean;
  assigneeName: string;
  labels: string[];
  dueDate: Date | null;
  projectName: string;
  updatedAt: Date;
}

/** The ticket page's own reads and writes: lookup by key, visibility, and sharing. */
export const ticketService = {
  /** Ticket keys are upper case (`EXY-14`), so a hand-typed `exy-14` still opens the ticket. */
  byKey(key: string) {
    return TaskModel.findOne({ key: key.trim().toUpperCase() }).lean();
  },

  /** A project's columns without its tickets — what the ticket page's status picker needs. */
  columns(projectId: string) {
    return BoardColumnModel.find({ projectId }).sort({ order: 1 }).lean();
  },

  /**
   * Makes a ticket public or private. Every switch to public issues a new token, so a link
   * handed out before the ticket was last made private never comes back to life.
   */
  async setVisibility(id: string, visibility: TaskVisibility, actor: Actor) {
    const before = await TaskModel.findById(id).select('visibility').lean();
    if (!before) notFound('Task');
    const current = before.visibility ?? 'PRIVATE';
    if (current !== visibility) {
      const publicToken = visibility === 'PUBLIC' ? randomBytes(TOKEN_BYTES).toString('hex') : null;
      await TaskModel.updateOne({ _id: id }, { visibility, publicToken });
      await record(id, actor, 'visibility', current, visibility);
    }
    const doc = await TaskModel.findById(id).lean();
    if (!doc) notFound('Task');
    return doc;
  },

  /**
   * Sends the ticket to the people chosen. Only active Projects users can be sent it — they
   * are the only people who could open the link — and the count of those told comes back.
   */
  async share(id: string, recipientIds: string[], note: string, actor: Actor): Promise<number> {
    const unique = [...new Set(recipientIds)];
    if (unique.length === 0 || unique.length > MAX_RECIPIENTS) {
      badRequest(`Choose between 1 and ${MAX_RECIPIENTS} people to share with`);
    }
    const trimmed = note.trim();
    if (trimmed.length > MAX_NOTE_LENGTH) {
      badRequest(`A note can be at most ${MAX_NOTE_LENGTH} characters`);
    }
    const task = await TaskModel.findById(id)
      .select('key title projectId assigneeId reporterId')
      .lean();
    if (!task) notFound('Task');
    const people = await UserModel.find({
      _id: { $in: unique },
      roles: ROLES.PROJECTS,
      isActive: true,
    })
      .select('name')
      .lean();
    const recipients = people.map((person) => String(person._id)).filter((pid) => pid !== actor.id);
    if (recipients.length === 0) {
      badRequest('None of the people chosen can open Projects');
    }
    await notifyShare(task, actor, recipients, trimmed);
    const names = people
      .filter((person) => String(person._id) !== actor.id)
      .map((person) => person.name);
    await record(id, actor, 'shared with', '', names.join(', '));
    return recipients.length;
  },

  /**
   * The public view of a ticket, or null when the token is unknown or the ticket has been
   * made private since. Both answer the same way, so a caller learns nothing about which
   * tokens once existed.
   */
  async publicTask(token: string): Promise<PublicTaskView | null> {
    if (token.length !== TOKEN_BYTES * 2) {
      return null;
    }
    const task = await TaskModel.findOne({ publicToken: token, visibility: 'PUBLIC' }).lean();
    if (!task) {
      return null;
    }
    const [project, column] = await Promise.all([
      ProjectModel.findById(task.projectId).select('name').lean(),
      BoardColumnModel.findById(task.columnId).select('name isDone').lean(),
    ]);
    return {
      key: task.key,
      title: task.title,
      description: task.description ?? '',
      type: task.type,
      priority: task.priority,
      status: column?.name ?? '',
      isDone: column?.isDone ?? false,
      assigneeName: task.assigneeName ?? '',
      labels: task.labels ?? [],
      dueDate: task.dueDate ?? null,
      projectName: project?.name ?? '',
      updatedAt: task.updatedAt,
    };
  },
};
