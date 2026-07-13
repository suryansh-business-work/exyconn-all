import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const CLIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'] as const;

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    status: { type: String, enum: CLIENT_STATUSES, required: true, default: 'PROSPECT' },
  },
  { timestamps: true },
);

export type ClientDocument = InferSchemaType<typeof clientSchema>;
export const ClientModel: Model<ClientDocument> = model<ClientDocument>('Client', clientSchema);
