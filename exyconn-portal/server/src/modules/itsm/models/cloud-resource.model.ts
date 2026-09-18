import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { IT_CLOUD_KINDS, IT_ENVIRONMENTS, IT_SERVICE_STATUSES } from '../itsm.enums';

/**
 * One piece of infrastructure the company pays for or depends on: a server, a cluster, a
 * database, a domain, a certificate. The live view of the Docker host stays in Tech ›
 * Infrastructure; this is the register of what exists, who owns it, what it costs and when
 * it expires.
 */
const cloudResourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    kind: { type: String, enum: IT_CLOUD_KINDS, required: true, default: 'SERVER' },
    provider: { type: String, default: '', trim: true },
    environment: { type: String, enum: IT_ENVIRONMENTS, required: true, default: 'PRODUCTION' },
    region: { type: String, default: '', trim: true },
    /** Hostname, URL or connection target — never a credential. */
    endpoint: { type: String, default: '', trim: true },
    /** When a domain or certificate lapses. Null for things that do not expire. */
    expiresAt: { type: Date, default: null },
    monthlyCost: { type: Number, required: true, default: 0, min: 0 },
    status: { type: String, enum: IT_SERVICE_STATUSES, required: true, default: 'ACTIVE' },
    ownerName: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ItCloudResourceDocument = InferSchemaType<typeof cloudResourceSchema>;
export const ItCloudResourceModel: Model<ItCloudResourceDocument> = model<ItCloudResourceDocument>(
  'ItCloudResource',
  cloudResourceSchema,
);
