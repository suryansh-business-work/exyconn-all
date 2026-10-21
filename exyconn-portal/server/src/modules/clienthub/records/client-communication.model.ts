import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const COMMUNICATION_TYPES = ['CALL', 'EMAIL', 'MEETING', 'MESSAGE', 'OTHER'] as const;
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];

/**
 * One conversation with a client — a call, an email, a meeting, a message — kept as the shared
 * record of what was said and agreed. Staff log them from Admin › Clients; the client reads the
 * same log in the client hub, so both sides work from one account of events.
 */
const clientCommunicationSchema = new Schema(
  {
    clientId: { type: String, required: true, trim: true },
    type: { type: String, enum: COMMUNICATION_TYPES, required: true, default: 'CALL' },
    occurredAt: { type: Date, required: true },
    subject: { type: String, required: true, trim: true },
    summary: { type: String, default: '', trim: true },
    details: { type: String, default: '', trim: true },
    /** Who took part, as written by whoever logged it ("Dana Reyes, Arjun from Exyconn"). */
    participants: { type: String, default: '', trim: true },
    loggedByName: { type: String, default: '', trim: true },
    /**
     * When the client's contacts were emailed about this entry. Claimed atomically before the
     * emails go, so a retried save never mails them twice.
     */
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

clientCommunicationSchema.index({ clientId: 1, occurredAt: -1 });

export type ClientCommunicationDocument = InferSchemaType<typeof clientCommunicationSchema>;
export const ClientCommunicationModel: Model<ClientCommunicationDocument> =
  model<ClientCommunicationDocument>('ClientCommunication', clientCommunicationSchema);
