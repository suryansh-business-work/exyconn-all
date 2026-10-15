import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The kinds of step a workflow is drawn from. START and END bound it, STEP is a piece of
 * work, and DECISION is a fork whose outgoing connections are labelled with the answers.
 */
export const WORKFLOW_NODE_KINDS = ['START', 'STEP', 'DECISION', 'END'] as const;

/** One box on the canvas. `key` is the editor's own id for it, stable across saves. */
const workflowNodeSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    kind: { type: String, enum: WORKFLOW_NODE_KINDS, required: true },
    label: { type: String, required: true, trim: true },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

/** One arrow between two boxes, optionally labelled (a decision's "Yes" / "No"). */
const workflowEdgeSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true },
    target: { type: String, required: true, trim: true },
    label: { type: String, default: '', trim: true },
  },
  { _id: false },
);

/**
 * A custom workflow drawn in the Projects portal's Tools > Workflows designer.
 *
 * The graph is stored inline: it is only ever read and written whole, by the one editor that
 * draws it, so splitting nodes and edges into collections would buy joins and nothing else.
 */
const projectWorkflowSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    nodes: { type: [workflowNodeSchema], default: [] },
    edges: { type: [workflowEdgeSchema], default: [] },
    createdByName: { type: String, default: '', trim: true },
    updatedByName: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ProjectWorkflowDocument = InferSchemaType<typeof projectWorkflowSchema>;

export const ProjectWorkflowModel: Model<ProjectWorkflowDocument> = model<ProjectWorkflowDocument>(
  'ProjectWorkflow',
  projectWorkflowSchema,
);
