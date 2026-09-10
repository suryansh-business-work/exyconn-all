import { createHash, randomBytes } from 'node:crypto';
import { ProjectShareModel } from './share.model';
import { ProjectModel } from './projects.model';
import { MilestoneModel } from './sprints.model';
import { BoardColumnModel, TaskModel } from './board.model';
import {
  TrackerIntervalModel,
  TrackerManualEntryModel,
  TrackerSessionModel,
} from '../tracker/models';
import { badRequest, notFound } from '../../utils/errors';

/** Bytes of entropy behind a share token. 32 bytes is 64 hex characters. */
const TOKEN_BYTES = 32;

/** The longest a share may live. A link nobody remembers issuing should stop working. */
const MAX_EXPIRY_DAYS = 365;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

/** How many tickets sit in one board column, i.e. one status. */
export interface SharedTicketCount {
  status: string;
  count: number;
}

/** The read-only view a client sees. Deliberately narrow — see `sharedProject`. */
export interface SharedProjectView {
  name: string;
  clientName: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  budgetHours: number | null;
  trackedHours: number;
  milestones: Array<{ name: string; dueOn: Date | null; state: string }>;
  ticketCounts: SharedTicketCount[];
}

/** A share token, hashed the one way it is ever compared. */
export function hashShareToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Whether a share can still be followed right now. */
export function isShareLive(
  share: { expiresAt: Date; revokedAt?: Date | null },
  now: Date = new Date(),
): boolean {
  if (share.revokedAt) {
    return false;
  }
  return share.expiresAt.getTime() > now.getTime();
}

/** Total hours booked to a project, tracked and approved off-computer, over all time. */
async function trackedHoursOf(projectId: string): Promise<number> {
  const sessions = await TrackerSessionModel.find({ projectId }).select('_id').lean();
  const sessionIds = sessions.map((session) => String(session._id));
  const [intervals, manual] = await Promise.all([
    sessionIds.length === 0
      ? Promise.resolve<Array<{ total: number }>>([])
      : TrackerIntervalModel.aggregate<{ total: number }>([
          { $match: { sessionId: { $in: sessionIds } } },
          { $group: { _id: null, total: { $sum: '$activeMs' } } },
        ]),
    TrackerManualEntryModel.aggregate<{ total: number }>([
      { $match: { projectId, status: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: '$durationMs' } } },
    ]),
  ]);
  const totalMs = (intervals[0]?.total ?? 0) + (manual[0]?.total ?? 0);
  return Math.round((totalMs / MS_PER_HOUR) * 100) / 100;
}

/** How many tickets sit in each column, in board order — the client's "by status". */
async function ticketCountsOf(projectId: string): Promise<SharedTicketCount[]> {
  const [columns, tasks] = await Promise.all([
    BoardColumnModel.find({ projectId }).sort({ order: 1 }).select('name').lean(),
    TaskModel.find({ projectId }).select('columnId').lean(),
  ]);
  const byColumn = new Map<string, number>();
  for (const task of tasks) {
    const id = String(task.columnId);
    byColumn.set(id, (byColumn.get(id) ?? 0) + 1);
  }
  return columns.map((column) => ({
    status: column.name,
    count: byColumn.get(String(column._id)) ?? 0,
  }));
}

/** Read-only client views of a project: issuing the links, revoking them, and reading one. */
export const shareService = {
  shares(projectId: string) {
    return ProjectShareModel.find({ projectId }).sort({ createdAt: -1 }).lean();
  },

  /**
   * Issues a link. The token is returned here and nowhere else — only its hash is stored —
   * so the caller must show it to the person creating the share straight away.
   */
  async createShare(
    projectId: string,
    label: string,
    expiresInDays: number,
    createdByName: string,
  ) {
    if (expiresInDays < 1 || expiresInDays > MAX_EXPIRY_DAYS) {
      badRequest(`A share must expire between 1 and ${MAX_EXPIRY_DAYS} days from now`);
    }
    const project = await ProjectModel.findById(projectId).select('_id').lean();
    if (!project) notFound('Project');

    const token = randomBytes(TOKEN_BYTES).toString('hex');
    const share = await ProjectShareModel.create({
      projectId,
      tokenHash: hashShareToken(token),
      label,
      expiresAt: new Date(Date.now() + expiresInDays * MS_PER_DAY),
      createdByName,
    });
    return { share: share.toObject(), token };
  },

  async revokeShare(id: string) {
    const doc = await ProjectShareModel.findByIdAndUpdate(
      id,
      { revokedAt: new Date() },
      { new: true },
    ).lean();
    if (!doc) notFound('ProjectShare');
    return doc;
  },

  /**
   * The client's view of a project, or null when the token is unknown, expired or revoked.
   *
   * All three cases answer the same way on purpose: an unauthenticated caller learns nothing
   * about which tokens exist, and the page has one message to render either way.
   *
   * What comes back is the whole contract of this feature: names, dates, budget against
   * tracked hours, the milestone list and how many tickets sit in each column. No comments,
   * no screenshots, no per-person time, and no ticket titles.
   */
  async sharedProject(token: string): Promise<SharedProjectView | null> {
    const share = await ProjectShareModel.findOne({ tokenHash: hashShareToken(token) }).lean();
    if (!share || !isShareLive(share)) {
      return null;
    }
    const projectId = String(share.projectId);
    const project = await ProjectModel.findById(projectId).lean();
    if (!project) {
      return null;
    }
    const [trackedHours, ticketCounts, milestones] = await Promise.all([
      trackedHoursOf(projectId),
      ticketCountsOf(projectId),
      MilestoneModel.find({ projectId }).sort({ dueOn: 1, createdAt: 1 }).lean(),
    ]);
    return {
      name: project.name,
      clientName: project.clientName ?? '',
      status: project.status,
      startDate: project.startDate ?? null,
      endDate: project.endDate ?? null,
      budgetHours: project.budgetHours ?? null,
      trackedHours,
      milestones: milestones.map((one) => ({
        name: one.name,
        dueOn: one.dueOn ?? null,
        state: one.state,
      })),
      ticketCounts,
    };
  },
};
