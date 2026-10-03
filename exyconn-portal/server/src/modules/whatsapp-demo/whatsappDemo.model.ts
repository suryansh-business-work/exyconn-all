import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The WhatsApp demo's content: one row per industry demo and one per workflow.
 *
 * A workflow keeps two graphs: `draft`, which the editor saves into, and `published`, the
 * snapshot the chat runs. Publishing copies one onto the other, so an admin can work on a
 * conversation for days without the chat ever seeing a half-wired graph. Both are stored as
 * plain JSON because their shape is owned by `graphSchema` in @exyconn/wa-flow and is parsed
 * there on every write.
 */
const demoSchema = new Schema(
  {
    /** URL slug, unique within the company (the tenant plugin scopes the index). */
    key: { type: String, required: true, unique: true, trim: true },
    industry: { type: String, required: true, trim: true },
    business: { type: Schema.Types.Mixed, required: true, default: {} },
    greeting: { type: String, required: true },
    menuText: { type: String, required: true },
    menuButton: { type: String, required: true },
    order: { type: Number, required: true, default: 0 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, minimize: false },
);

demoSchema.index({ order: 1 });

const workflowSchema = new Schema(
  {
    demoId: { type: String, required: true },
    /** Denormalised from the demo, so analytics rows (which carry keys) join without a lookup. */
    demoKey: { type: String, required: true },
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    keywords: { type: [String], default: [] },
    order: { type: Number, required: true, default: 0 },
    draft: { type: Schema.Types.Mixed, required: true },
    published: { type: Schema.Types.Mixed, default: null },
    /** 0 until the first publish; raised by one on every publish. */
    version: { type: Number, required: true, default: 0 },
    publishedAt: { type: Date, default: null },
    updatedById: { type: String, default: null },
    updatedByName: { type: String, default: null },
  },
  { timestamps: true, minimize: false },
);

/** A `jump` node names its target by key, so a key means one workflow within its demo. */
workflowSchema.index({ demoId: 1, key: 1 }, { unique: true });
workflowSchema.index({ demoId: 1, order: 1 });

export type WhatsappDemoDocument = InferSchemaType<typeof demoSchema>;
export type WhatsappWorkflowDocument = InferSchemaType<typeof workflowSchema>;

export const WhatsappDemoModel: Model<WhatsappDemoDocument> = model<WhatsappDemoDocument>(
  'WhatsappDemo',
  demoSchema,
);
export const WhatsappWorkflowModel: Model<WhatsappWorkflowDocument> =
  model<WhatsappWorkflowDocument>('WhatsappWorkflow', workflowSchema);
