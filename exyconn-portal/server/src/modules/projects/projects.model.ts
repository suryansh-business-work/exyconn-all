import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const;

/** How many letters of the project name become its key, and the longest key we will keep. */
const KEY_LENGTH = 4;

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    status: { type: String, enum: PROJECT_STATUSES, required: true, default: 'PLANNING' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    /** The prefix every ticket key carries, e.g. `EXY` in `EXY-14`. */
    key: { type: String, trim: true, uppercase: true, default: '' },
    /** Last ticket number handed out. Incremented atomically, so numbers are never reused. */
    ticketCounter: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

/** `Exyconn Portal` → `EXYC`. Letters and digits only, so the key is safe inside a ticket key. */
function deriveKey(name: string): string {
  const letters = name.toUpperCase().replaceAll(/[^A-Z\d]/g, '');
  return letters.slice(0, KEY_LENGTH) || 'PROJ';
}

/**
 * A project without a key gets one from its name, made unique by a numeric suffix. Done here
 * rather than in the form so a project created through any path still has a key — a ticket
 * cannot be given a handle without one.
 */
projectSchema.pre('validate', async function assignKey() {
  if (this.key) {
    return;
  }
  const base = deriveKey(this.name);
  const taken = await ProjectModel.countDocuments({ key: new RegExp(`^${base}\\d*$`) });
  this.key = taken === 0 ? base : `${base}${taken + 1}`;
});

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const ProjectModel: Model<ProjectDocument> = model<ProjectDocument>(
  'Project',
  projectSchema,
);
