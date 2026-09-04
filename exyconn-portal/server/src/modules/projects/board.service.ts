import { BoardColumnModel, TaskCommentModel, TaskModel } from './board.model';
import { ProjectModel } from './projects.model';
import { badRequest, notFound } from '../../utils/errors';

/** Everything a person can set on a ticket. Absent fields are left as they are. */
export interface TaskInput {
  title: string;
  description?: string | null;
  type?: string | null;
  priority?: string | null;
  assigneeId?: string | null;
  labels?: string[] | null;
  storyPoints?: number | null;
  dueDate?: Date | null;
}

/** Who is acting, for the fields a ticket records about people rather than about work. */
export interface Actor {
  id: string;
  name: string;
}

/**
 * Hands out the next ticket key for a project — `EXY-14`.
 *
 * The counter is incremented in the same atomic update that reads it, so two people creating
 * a ticket at the same moment cannot be handed the same number.
 */
async function nextKey(projectId: string): Promise<string> {
  const project = await ProjectModel.findByIdAndUpdate(
    projectId,
    { $inc: { ticketCounter: 1 } },
    { new: true },
  ).lean();
  if (!project) {
    notFound('Project');
  }
  return `${project.key}-${project.ticketCounter}`;
}

/** The editable fields present in an input, ready to write. Absent keys are not touched. */
function patchOf(input: TaskInput, assigneeName?: string): Record<string, unknown> {
  const patch: Record<string, unknown> = { title: input.title };
  const optional: Record<string, unknown> = {
    description: input.description,
    type: input.type,
    priority: input.priority,
    labels: input.labels,
    storyPoints: input.storyPoints,
    dueDate: input.dueDate,
  };
  for (const [field, value] of Object.entries(optional)) {
    if (value !== undefined) {
      patch[field] = value;
    }
  }
  if (assigneeName !== undefined) {
    patch.assigneeId = input.assigneeId ?? '';
    patch.assigneeName = assigneeName;
  }
  return patch;
}

/** Domain logic for the per-project board: columns, tickets and their comments. */
export const boardService = {
  async board(projectId: string) {
    const [columns, tasks] = await Promise.all([
      BoardColumnModel.find({ projectId }).sort({ order: 1 }).lean(),
      TaskModel.find({ projectId }).sort({ order: 1 }).lean(),
    ]);
    return { columns, tasks };
  },

  tasks(projectId: string) {
    return TaskModel.find({ projectId }).sort({ createdAt: -1 }).lean();
  },

  async createColumn(projectId: string, name: string) {
    const order = await BoardColumnModel.countDocuments({ projectId });
    return (await BoardColumnModel.create({ projectId, name, order })).toObject();
  },

  async renameColumn(id: string, name: string) {
    const doc = await BoardColumnModel.findByIdAndUpdate(id, { name }, { new: true }).lean();
    if (!doc) notFound('BoardColumn');
    return doc;
  },

  async deleteColumn(id: string) {
    const doc = await BoardColumnModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('BoardColumn');
    await TaskModel.deleteMany({ columnId: id });
    return true;
  },

  async reorderColumns(projectId: string, columnIds: string[]) {
    await Promise.all(
      columnIds.map((id, order) =>
        BoardColumnModel.updateOne({ _id: id, projectId }, { order }).exec(),
      ),
    );
    return true;
  },

  /** The reporter is whoever created the ticket, and is never editable afterwards. */
  async createTask(
    projectId: string,
    columnId: string,
    input: TaskInput,
    reporter: Actor,
    assigneeName: string,
  ) {
    const order = await TaskModel.countDocuments({ columnId });
    const created = await TaskModel.create({
      ...patchOf(input, assigneeName),
      projectId,
      columnId,
      key: await nextKey(projectId),
      reporterId: reporter.id,
      reporterName: reporter.name,
      order,
    });
    return created.toObject();
  },

  async updateTask(id: string, input: TaskInput, assigneeName: string) {
    const doc = await TaskModel.findByIdAndUpdate(id, patchOf(input, assigneeName), {
      new: true,
    }).lean();
    if (!doc) notFound('Task');
    return doc;
  },

  async deleteTask(id: string) {
    const doc = await TaskModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Task');
    await TaskCommentModel.deleteMany({ taskId: id });
    return true;
  },

  /** Moves a ticket into a column at a given index and renumbers both columns. */
  async moveTask(id: string, toColumnId: string, toIndex: number) {
    const task = await TaskModel.findById(id);
    if (!task) notFound('Task');
    const fromColumnId = task.columnId.toString();

    task.columnId = toColumnId as never;
    await task.save();

    if (fromColumnId !== toColumnId) await renumber(fromColumnId);
    await renumber(toColumnId, id, toIndex);
    return true;
  },

  comments(taskId: string) {
    return TaskCommentModel.find({ taskId }).sort({ createdAt: 1 }).lean();
  },

  async addComment(taskId: string, body: string, author: Actor) {
    if (body.trim() === '') {
      badRequest('A comment cannot be empty');
    }
    const task = await TaskModel.findById(taskId).select('_id').lean();
    if (!task) notFound('Task');
    const created = await TaskCommentModel.create({
      taskId,
      body,
      authorId: author.id,
      authorName: author.name,
    });
    return created.toObject();
  },

  async deleteComment(id: string) {
    const doc = await TaskCommentModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('TaskComment');
    return true;
  },
};

/** Rewrites the `order` of every ticket in a column, optionally forcing one to an index. */
async function renumber(columnId: string, pinId?: string, pinIndex?: number) {
  const tasks = await TaskModel.find({ columnId }).sort({ order: 1 }).select('_id').lean();
  let ids = tasks.map((t) => t._id.toString());
  if (pinId && pinIndex !== undefined) {
    ids = ids.filter((tid) => tid !== pinId);
    ids.splice(Math.max(0, Math.min(pinIndex, ids.length)), 0, pinId);
  }
  await Promise.all(ids.map((tid, order) => TaskModel.updateOne({ _id: tid }, { order }).exec()));
}
