import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { STATUS_CATEGORIES, STATUS_STATES } from './status.constants';

/**
 * One endpoint the platform watches. Seeded from the catalogue on first boot and
 * maintained afterwards from Tech > Status Monitors, so the public status page always
 * lists exactly what the team says it should.
 *
 * The `last*` fields are the live result of the most recent probe; the per-day history
 * lives in `StatusDaily` and outages in `StatusIncident`.
 */
const statusMonitorSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, enum: STATUS_CATEGORIES, required: true, default: 'PORTAL' },
    url: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: true },
    order: { type: Number, required: true, default: 0 },

    state: { type: String, enum: STATUS_STATES, required: true, default: 'UNKNOWN' },
    lastCheckedAt: { type: Date, default: null },
    lastResponseMs: { type: Number, required: true, default: 0 },
    lastHttpStatus: { type: Number, required: true, default: 0 },
    lastError: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

statusMonitorSchema.index({ order: 1 });

export type StatusMonitorDocument = InferSchemaType<typeof statusMonitorSchema>;
export const StatusMonitorModel: Model<StatusMonitorDocument> = model<StatusMonitorDocument>(
  'StatusMonitor',
  statusMonitorSchema,
);
