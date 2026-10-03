import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Every nameserver change made from the portal, newest last. It is what "Back to GoDaddy"
 * restores — the nameservers the domain had before it was first pointed elsewhere — and the
 * trail of who moved a domain's DNS, and when.
 */
const nameserverChangeSchema = new Schema(
  {
    domain: { type: String, required: true, trim: true, lowercase: true, index: true },
    target: { type: String, required: true, enum: ['CLOUDFLARE', 'GODADDY', 'CUSTOM'] },
    previous: { type: [String], default: [] },
    next: { type: [String], default: [] },
    actorId: { type: String, default: '' },
  },
  { timestamps: true },
);

export type NameserverChangeDocument = InferSchemaType<typeof nameserverChangeSchema>;

export const NameserverChangeModel: Model<NameserverChangeDocument> =
  model<NameserverChangeDocument>('NameserverChange', nameserverChangeSchema);
