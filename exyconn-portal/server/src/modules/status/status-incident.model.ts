import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { STATUS_STATES } from './status.constants';

/**
 * An unbroken stretch during which a monitor was not operational. Opened by the first
 * failing probe and closed by the first healthy one, so the status page can show
 * "what happened" without replaying every check.
 */
const statusIncidentSchema = new Schema(
  {
    serviceKey: { type: String, required: true, trim: true },
    serviceName: { type: String, required: true, trim: true },
    state: { type: String, enum: STATUS_STATES, required: true, default: 'DOWN' },
    reason: { type: String, default: '', trim: true },
    startedAt: { type: Date, required: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

statusIncidentSchema.index({ serviceKey: 1, resolvedAt: 1 });
statusIncidentSchema.index({ startedAt: -1 });

export type StatusIncidentDocument = InferSchemaType<typeof statusIncidentSchema>;
export const StatusIncidentModel: Model<StatusIncidentDocument> = model<StatusIncidentDocument>(
  'StatusIncident',
  statusIncidentSchema,
);
