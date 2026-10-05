import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A person at a client who may sign in to the client hub (clienthub.exyconn.com) with their
 * email and a one-time code — no password. Several people at one client may have access; each
 * sees that client's invoices, payments, support tickets and projects.
 *
 * Not a portal user: a contact holds a client-hub pass that opens the client hub and nothing
 * else (see lib/scopedPass). The address is unique across the platform (PLATFORM_UNIQUE_PATHS),
 * so signing in never has to ask which client someone means. Switching a contact off retires
 * their pass at once.
 */
const clientContactSchema = new Schema(
  {
    clientId: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    active: { type: Boolean, required: true, default: true },
    lastSignInAt: { type: Date, default: null },
    signInCount: { type: Number, required: true, default: 0 },
    /** Raised to retire every pass issued before it. */
    tokenVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type ClientContactDocument = InferSchemaType<typeof clientContactSchema>;

export const ClientContactModel: Model<ClientContactDocument> = model<ClientContactDocument>(
  'ClientContact',
  clientContactSchema,
);
