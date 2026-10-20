import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** The kinds of record an address can come from. */
export const RECIPIENT_RECORD_KINDS = ['CONTACT', 'COMPANY', 'CLIENT'] as const;

/**
 * How a record got into the audience: matched by the rules, linked to a matching company,
 * or named by hand under Data sources.
 */
export const RECIPIENT_VIAS = ['RULES', 'LINKED_CONTACT', 'SELECTED'] as const;

/** One record behind an address — kept so every send can say who an address stood for. */
export const recipientSourceSchema = new Schema(
  {
    kind: { type: String, enum: RECIPIENT_RECORD_KINDS, required: true },
    id: { type: String, required: true },
    name: { type: String, default: '' },
    via: { type: String, enum: RECIPIENT_VIAS, required: true },
  },
  { _id: false },
);

/**
 * A FIXED_SNAPSHOT audience's frozen addresses, one row each.
 *
 * Its own collection rather than an array on the audience: a CRM-wide snapshot runs to tens
 * of thousands of addresses, and a single document stops at 16 MB.
 */
const snapshotEmailSchema = new Schema(
  {
    audienceId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    label: { type: String, default: '' },
    company: { type: String, default: '' },
    sources: { type: [recipientSourceSchema], default: [] },
  },
  { timestamps: false },
);
snapshotEmailSchema.index({ audienceId: 1, email: 1 }, { unique: true });

/** A FIXED_RECORDS audience's frozen records; their addresses are read fresh each time. */
const snapshotRecordSchema = new Schema(
  {
    audienceId: { type: String, required: true, index: true },
    kind: { type: String, enum: RECIPIENT_RECORD_KINDS, required: true },
    recordId: { type: String, required: true },
    via: { type: String, enum: RECIPIENT_VIAS, required: true },
  },
  { timestamps: false },
);
snapshotRecordSchema.index({ audienceId: 1, kind: 1, recordId: 1 }, { unique: true });

export type AudienceSnapshotEmailDocument = InferSchemaType<typeof snapshotEmailSchema>;
export const AudienceSnapshotEmailModel: Model<AudienceSnapshotEmailDocument> =
  model<AudienceSnapshotEmailDocument>('AudienceSnapshotEmail', snapshotEmailSchema);

export type AudienceSnapshotRecordDocument = InferSchemaType<typeof snapshotRecordSchema>;
export const AudienceSnapshotRecordModel: Model<AudienceSnapshotRecordDocument> =
  model<AudienceSnapshotRecordDocument>('AudienceSnapshotRecord', snapshotRecordSchema);
