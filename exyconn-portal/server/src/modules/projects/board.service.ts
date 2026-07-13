import { BoardColumnModel, TaskModel } from './board.model';
import { notFound } from '../../utils/errors';

/** Domain logic for the per-project kanban board (columns + tasks). */
export const boardService = {
  async board(projectId: string) {
    const [columns, tasks] = await Promise.all([
      BoardColumnModel.find({ projectId }).sort({ order: 1 }).lean(),
      TaskModel.find({ projectId }).sort({ order: 1 }).lean(),
    ]);
    return { columns, tasks };
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

  async createTask(
    projectId: string,
    columnId: string,
    title: string,
    description?: string | null,
  ) {
    const order = await TaskModel.countDocuments({ columnId });
    return (
      await TaskModel.create({
        projectId,
        columnId,
        title,
        description: description ?? null,
        order,
      })
    ).toObject();
  },

  async updateTask(id: string, patch: { title?: string; description?: string | null }) {
    const doc = await TaskModel.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!doc) notFound('Task');
    return doc;
  },

  async deleteTask(id: string) {
    const doc = await TaskModel.findByIdAndDelete(id).lean();
    if (!doc) notFound('Task');
    return true;
  },

  /** Moves a task into a column at a given index and renumbers both columns. */
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
};

/** Rewrites the `order` of every task in a column, optionally forcing one task
 *  to a specific index. Keeps ordering dense and gap-free. */
async function renumber(columnId: string, pinId?: string, pinIndex?: number) {
  const tasks = await TaskModel.find({ columnId }).sort({ order: 1 }).select('_id').lean();
  let ids = tasks.map((t) => t._id.toString());
  if (pinId && pinIndex !== undefined) {
    ids = ids.filter((tid) => tid !== pinId);
    ids.splice(Math.max(0, Math.min(pinIndex, ids.length)), 0, pinId);
  }
  await Promise.all(ids.map((tid, order) => TaskModel.updateOne({ _id: tid }, { order }).exec()));
}
