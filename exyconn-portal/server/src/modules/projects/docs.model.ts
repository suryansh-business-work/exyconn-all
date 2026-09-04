import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One page in a project's documentation space.
 *
 * Pages nest: `parentId` is null for a top-level page and the parent's id for anything
 * filed under it, which is what makes the sidebar a tree rather than a list. The body is
 * rich text (HTML) written in the same editor the rest of the portal uses.
 */
const docPageSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'DocPage', default: null, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    order: { type: Number, required: true, default: 0 },
    /** Who saved it last, kept beside the id so the page footer reads without a join. */
    updatedById: { type: String, default: '' },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

export type DocPageDocument = InferSchemaType<typeof docPageSchema>;

export const DocPageModel: Model<DocPageDocument> = model<DocPageDocument>(
  'DocPage',
  docPageSchema,
);
