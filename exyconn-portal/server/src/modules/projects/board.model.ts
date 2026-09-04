import { Schema, model, Types, type InferSchemaType, type Model } from 'mongoose';

/** What a ticket is. Mirrors the issue types a board is normally organised around. */
export const TASK_TYPES = ['TASK', 'STORY', 'BUG', 'EPIC'] as const;

/** How urgent the ticket is, most urgent first. */
export const TASK_PRIORITIES = ['HIGHEST', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'] as const;

/** A kanban column scoped to a single project. */
const boardColumnSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

/**
 * A ticket (card) belonging to a column within a project board.
 *
 * `key` is the human handle — `EXY-14` — written once at creation from the project's key and
 * its own counter, so it never changes when the ticket is dragged, renamed or reassigned.
 * Assignee and reporter names are denormalised alongside their ids for the same reason every
 * other module does it: a board renders dozens of cards and must not join to users for each.
 */
const taskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    columnId: { type: Schema.Types.ObjectId, ref: 'BoardColumn', required: true, index: true },
    key: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    /** Rich text (HTML) written in the ticket dialog's editor. */
    description: { type: String, trim: true, default: null },
    type: { type: String, enum: TASK_TYPES, required: true, default: 'TASK' },
    priority: { type: String, enum: TASK_PRIORITIES, required: true, default: 'MEDIUM' },
    assigneeId: { type: String, default: '' },
    assigneeName: { type: String, default: '' },
    reporterId: { type: String, default: '' },
    reporterName: { type: String, default: '' },
    labels: { type: [String], default: [] },
    /** Estimate in points. Null means nobody has sized it yet, which is not the same as zero. */
    storyPoints: { type: Number, default: null },
    dueDate: { type: Date, default: null },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

/** One comment on a ticket. The author's name is kept so the thread reads without a join. */
const taskCommentSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export type BoardColumnDocument = InferSchemaType<typeof boardColumnSchema>;
export type TaskDocument = InferSchemaType<typeof taskSchema>;
export type TaskCommentDocument = InferSchemaType<typeof taskCommentSchema>;

export const BoardColumnModel: Model<BoardColumnDocument> = model<BoardColumnDocument>(
  'BoardColumn',
  boardColumnSchema,
);
export const TaskModel: Model<TaskDocument> = model<TaskDocument>('Task', taskSchema);
export const TaskCommentModel: Model<TaskCommentDocument> = model<TaskCommentDocument>(
  'TaskComment',
  taskCommentSchema,
);

export { Types };
