import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A planned window during which some services will be unavailable. Announced on the
 * public status page while it is upcoming or in progress, and the affected services
 * show a "maintenance" state instead of their probe result for its duration.
 */
const statusMaintenanceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    affectedServiceKeys: { type: [String], default: [] },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    createdBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

statusMaintenanceSchema.index({ endsAt: 1, startsAt: 1 });

export type StatusMaintenanceDocument = InferSchemaType<typeof statusMaintenanceSchema>;
export const StatusMaintenanceModel: Model<StatusMaintenanceDocument> =
  model<StatusMaintenanceDocument>('StatusMaintenance', statusMaintenanceSchema);
