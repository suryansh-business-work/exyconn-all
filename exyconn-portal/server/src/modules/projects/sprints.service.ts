import { MilestoneModel, SprintModel } from './sprints.model';
import { BoardColumnModel, TaskModel } from './board.model';
import { badRequest, notFound } from '../../utils/errors';

/** Everything a person can set on a sprint. */
export interface SprintInput {
  name: string;
  goal?: string | null;
  startsOn?: Date | null;
  endsOn?: Date | null;
}

/** Everything a person can set on a milestone. */
export interface MilestoneInput {
  name: string;
  description?: string | null;
  dueOn?: Date | null;
  state?: string | null;
}

/** Where the tickets left over at the end of a sprint are going to land. */
export interface SprintCompletionPlan {
  unfinishedCount: number;
  /** The next planned sprint they move to, or null when they go back to the backlog. */
  targetSprintId: string | null;
  targetSprintName: string;
}

/**
 * The column a board treats as "done": the last one, by order.
 *
 * A board's columns are the project's own, so there is no fixed Done column to look up by
 * name. The right-most column is the convention every one of these boards already follows,
 * and it is the only definition that does not need a second piece of per-project config.
 */
async function doneColumnId(projectId: string): Promise<string | null> {
  const last = await BoardColumnModel.find({ projectId })
    .sort({ order: -1 })
    .limit(1)
    .select('_id')
    .lean();
  return last[0] ? String(last[0]._id) : null;
}

/** The sprint's tickets that are not in the done column, i.e. the ones that carry over. */
async function unfinishedTaskIds(projectId: string, sprintId: string): Promise<string[]> {
  const done = await doneColumnId(projectId);
  const filter: Record<string, unknown> = { sprintId };
  if (done) {
    filter.columnId = { $ne: done };
  }
  const tasks = await TaskModel.find(filter).select('_id').lean();
  return tasks.map((task) => String(task._id));
}

/** The planned sprint that starts soonest — where carry-over goes when there is one. */
async function nextPlannedSprint(projectId: string, excludeId: string) {
  const candidates = await SprintModel.find({
    projectId,
    state: 'PLANNED',
    _id: { $ne: excludeId },
  })
    .sort({ startsOn: 1, createdAt: 1 })
    .limit(1)
    .lean();
  return candidates[0] ?? null;
}

/** Sprints, milestones, and the two ticket links that hang tickets off them. */
export const sprintsService = {
  sprints(projectId: string) {
    return SprintModel.find({ projectId }).sort({ startsOn: 1, createdAt: 1 }).lean();
  },

  milestones(projectId: string) {
    return MilestoneModel.find({ projectId }).sort({ dueOn: 1, createdAt: 1 }).lean();
  },

  async createSprint(projectId: string, input: SprintInput) {
    return (await SprintModel.create({ ...input, projectId })).toObject();
  },

  async updateSprint(id: string, input: SprintInput) {
    const doc = await SprintModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!doc) notFound('Sprint');
    return doc;
  },

  /** Deleting a sprint returns its tickets to the backlog rather than deleting them. */
  async deleteSprint(id: string) {
    const doc = await SprintModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Sprint');
    await TaskModel.updateMany({ sprintId: id }, { sprintId: null });
    return true;
  },

  /**
   * Starts a sprint. A project runs one sprint at a time — two active sprints make
   * "the board" ambiguous, and the board's sprint selector has one active option.
   */
  async startSprint(id: string) {
    const sprint = await SprintModel.findById(id).lean();
    if (!sprint) notFound('Sprint');
    if (sprint.state !== 'PLANNED') {
      badRequest('Only a planned sprint can be started');
    }
    const running = await SprintModel.countDocuments({
      projectId: sprint.projectId,
      state: 'ACTIVE',
    });
    if (running > 0) {
      badRequest('This project already has a sprint running — complete it first');
    }
    const doc = await SprintModel.findByIdAndUpdate(id, { state: 'ACTIVE' }, { new: true }).lean();
    if (!doc) notFound('Sprint');
    return doc;
  },

  /** What completing this sprint would do to its leftovers, so the UI can say so first. */
  async completionPlan(id: string): Promise<SprintCompletionPlan> {
    const sprint = await SprintModel.findById(id).lean();
    if (!sprint) notFound('Sprint');
    const projectId = String(sprint.projectId);
    const [unfinished, next] = await Promise.all([
      unfinishedTaskIds(projectId, id),
      nextPlannedSprint(projectId, id),
    ]);
    return {
      unfinishedCount: unfinished.length,
      targetSprintId: next ? String(next._id) : null,
      targetSprintName: next?.name ?? 'the backlog',
    };
  },

  /**
   * Completes a sprint and moves everything still open into the next planned sprint, or
   * back to the backlog when there is not one. Unfinished work is never left pointing at a
   * completed sprint: that is how a burn-down starts lying about what is left to do.
   */
  async completeSprint(id: string) {
    const sprint = await SprintModel.findById(id).lean();
    if (!sprint) notFound('Sprint');
    if (sprint.state === 'COMPLETED') {
      badRequest('This sprint is already complete');
    }
    const leftover = await unfinishedTaskIds(String(sprint.projectId), id);
    if (leftover.length > 0) {
      const next = await nextPlannedSprint(String(sprint.projectId), id);
      await TaskModel.updateMany(
        { _id: { $in: leftover } },
        { sprintId: next ? String(next._id) : null },
      );
    }
    const doc = await SprintModel.findByIdAndUpdate(
      id,
      { state: 'COMPLETED' },
      { new: true },
    ).lean();
    if (!doc) notFound('Sprint');
    return doc;
  },

  async createMilestone(projectId: string, input: MilestoneInput) {
    return (await MilestoneModel.create({ ...input, projectId })).toObject();
  },

  async updateMilestone(id: string, input: MilestoneInput) {
    const doc = await MilestoneModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!doc) notFound('Milestone');
    return doc;
  },

  async deleteMilestone(id: string) {
    const doc = await MilestoneModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Milestone');
    await TaskModel.updateMany({ milestoneId: id }, { milestoneId: null });
    return true;
  },

  /** Puts a ticket in a sprint, or takes it back to the backlog with a null sprint. */
  async setTaskSprint(taskId: string, sprintId: string | null) {
    const doc = await TaskModel.findByIdAndUpdate(taskId, { sprintId }, { new: true }).lean();
    if (!doc) notFound('Task');
    return doc;
  },

  /**
   * Files a ticket under an epic. A ticket cannot be its own parent, and an epic cannot be
   * filed under anything — one level of nesting is what the board can draw.
   */
  async setTaskParent(taskId: string, parentTaskId: string | null) {
    if (parentTaskId === taskId) {
      badRequest('A ticket cannot be its own epic');
    }
    if (parentTaskId) {
      const parent = await TaskModel.findById(parentTaskId).select('type').lean();
      if (!parent) notFound('Task');
      if (parent.type !== 'EPIC') {
        badRequest('A ticket can only be filed under an epic');
      }
    }
    const doc = await TaskModel.findByIdAndUpdate(taskId, { parentTaskId }, { new: true }).lean();
    if (!doc) notFound('Task');
    return doc;
  },
};
