import { Schema, model, Types, type InferSchemaType, type Model } from 'mongoose';

/** A kanban column scoped to a single project. */
const boardColumnSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

/** A task (card) belonging to a column within a project board. */
const taskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    columnId: { type: Schema.Types.ObjectId, ref: 'BoardColumn', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type BoardColumnDocument = InferSchemaType<typeof boardColumnSchema>;
export type TaskDocument = InferSchemaType<typeof taskSchema>;

export const BoardColumnModel: Model<BoardColumnDocument> = model<BoardColumnDocument>(
  'BoardColumn',
  boardColumnSchema,
);
export const TaskModel: Model<TaskDocument> = model<TaskDocument>('Task', taskSchema);

export { Types };
