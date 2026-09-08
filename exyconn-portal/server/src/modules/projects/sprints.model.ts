import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Where a sprint is in its life. Only one sprint per project may be ACTIVE. */
export const SPRINT_STATES = ['PLANNED', 'ACTIVE', 'COMPLETED'] as const;

/** Where a milestone is. A milestone is a date the team committed to, not a container. */
export const MILESTONE_STATES = ['PLANNED', 'IN_PROGRESS', 'HIT', 'MISSED'] as const;

/**
 * A time-boxed run of work on one project.
 *
 * The dates are what the team agreed, not what happened: `startsOn`/`endsOn` stay as
 * planned even when a sprint is started late or completed early, because a sprint report
 * that silently moved its own window would make every velocity comparison meaningless.
 */
const sprintSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    goal: { type: String, default: '', trim: true },
    startsOn: { type: Date, default: null },
    endsOn: { type: Date, default: null },
    state: { type: String, enum: SPRINT_STATES, required: true, default: 'PLANNED' },
  },
  { timestamps: true },
);

/** A dated commitment on a project — a launch, a review, a hand-over. */
const milestoneSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    dueOn: { type: Date, default: null },
    state: { type: String, enum: MILESTONE_STATES, required: true, default: 'PLANNED' },
  },
  { timestamps: true },
);

export type SprintDocument = InferSchemaType<typeof sprintSchema>;
export type MilestoneDocument = InferSchemaType<typeof milestoneSchema>;

export const SprintModel: Model<SprintDocument> = model<SprintDocument>('Sprint', sprintSchema);
export const MilestoneModel: Model<MilestoneDocument> = model<MilestoneDocument>(
  'Milestone',
  milestoneSchema,
);
