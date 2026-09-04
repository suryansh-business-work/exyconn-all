import { BoardColumnModel, TaskActivityModel, TaskCommentModel, TaskModel } from './board.model';
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

/** How much of a long value the trail keeps. Enough to recognise, not enough to re-read. */
const VALUE_LIMIT = 60;

/** The fields whose changes are worth recording, and what to call them in the trail. */
const TRACKED_FIELDS: Readonly<Record<string, string>> = {
  title: 'summary',
  description: 'description',
  type: 'type',
  priority: 'priority',
  assigneeName: 'assignee',
  labels: 'labels',
  storyPoints: 'story points',
  dueDate: 'due date',
};

/** One value as the trail shows it: short, plain, and never HTML. */
function display(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (Array.isArray(value)) {
    return value.join(', ').slice(0, VALUE_LIMIT);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value)
    .replaceAll(/<[^>]*>/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .slice(0, VALUE_LIMIT);
}

/** Writes one line of history. Never throws into the caller: a lost trail is not a lost edit. */
async function record(
  taskId: string,
  actor: Actor,
  field: string,
  fromValue: unknown,
  toValue: unknown,
) {
  try {
    await TaskActivityModel.create({
      taskId,
      actorId: actor.id,
      actorName: actor.name,
      field,
      fromValue: display(fromValue),
      toValue: display(toValue),
    });
  } catch (error) {
    console.error('Could not record ticket history', error);
  }
}

/** Every tracked field that differs between the ticket as it was and as it now is. */
function changesBetween(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Array<{ field: string; from: unknown; to: unknown }> {
  const changes: Array<{ field: string; from: unknown; to: unknown }> = [];
  for (const [key, label] of Object.entries(TRACKED_FIELDS)) {
    const from = display(before[key]);
    const to = display(after[key]);
    if (from !== to) {
      changes.push({ field: label, from: before[key], to: after[key] });
    }
  }
  return changes;
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
    await record(created.id, reporter, 'created', '', created.key);
    return created.toObject();
  },

  async updateTask(id: string, input: TaskInput, assigneeName: string, actor: Actor) {
    const before = await TaskModel.findById(id).lean();
    if (!before) notFound('Task');

    const doc = await TaskModel.findByIdAndUpdate(id, patchOf(input, assigneeName), {
      new: true,
    }).lean();
    if (!doc) notFound('Task');

    for (const change of changesBetween(before, doc)) {
      await record(id, actor, change.field, change.from, change.to);
    }
    return doc;
  },

  async deleteTask(id: string) {
    const doc = await TaskModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Task');
    await Promise.all([
      TaskCommentModel.deleteMany({ taskId: id }),
      TaskActivityModel.deleteMany({ taskId: id }),
    ]);
    return true;
  },

  /**
   * Moves a ticket into a column at a given index and renumbers both columns. A move between
   * columns is the change a board is most often asked about later, so it joins the trail —
   * by column NAME, because a column can be renamed or deleted after the fact.
   */
  async moveTask(id: string, toColumnId: string, toIndex: number, actor: Actor) {
    const task = await TaskModel.findById(id);
    if (!task) notFound('Task');
    const fromColumnId = task.columnId.toString();

    task.columnId = toColumnId as never;
    await task.save();

    if (fromColumnId !== toColumnId) {
      const [from, to] = await Promise.all([
        BoardColumnModel.findById(fromColumnId).select('name').lean(),
        BoardColumnModel.findById(toColumnId).select('name').lean(),
      ]);
      await renumber(fromColumnId);
      await record(id, actor, 'column', from?.name ?? '', to?.name ?? '');
    }
    await renumber(toColumnId, id, toIndex);
    return true;
  },

  activity(taskId: string) {
    return TaskActivityModel.find({ taskId }).sort({ createdAt: -1 }).lean();
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
