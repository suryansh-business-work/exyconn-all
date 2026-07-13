import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  GIG_APPLICATION_TYPES,
  GIG_CATEGORIES,
  GIG_DURATIONS,
  GIG_STATUSES,
} from '../website.constants';

const gigSchema = new Schema(
  {
    /** Stable business key from the website data, e.g. "GIG-DES-001". */
    gigCode: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: GIG_CATEGORIES },
    shortDescription: { type: String, default: '', trim: true },
    /** Rich-text gig description (HTML). */
    fullDescription: { type: String, default: '' },
    deliverables: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    budget: { type: String, default: '', trim: true },
    duration: { type: String, required: true, enum: GIG_DURATIONS },
    status: { type: String, required: true, enum: GIG_STATUSES, default: 'open' },
    applicationType: { type: String, required: true, enum: GIG_APPLICATION_TYPES, default: 'email' },
    applicationContact: { type: String, required: true, trim: true },
    postedDate: { type: Date, required: true, default: Date.now },
    deadline: { type: Date, default: null },
    isUrgent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type GigDocument = InferSchemaType<typeof gigSchema>;
export const GigModel: Model<GigDocument> = model<GigDocument>('Gig', gigSchema);
