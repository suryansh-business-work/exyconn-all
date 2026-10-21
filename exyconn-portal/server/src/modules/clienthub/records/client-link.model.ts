import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * An important link a client should have to hand — their staging site, a shared drive, a design
 * file, a status page. Staff add them from Admin › Clients › client › Links; every contact at
 * the client sees them in the client hub. Plain text only: nothing here is rendered as HTML.
 */
const clientLinkSchema = new Schema(
  {
    clientId: { type: String, required: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    /** One line saying what the link is for. */
    description: { type: String, default: '', trim: true },
    /** Anything longer: how to sign in, who owns it, what to look at first. */
    details: { type: String, default: '', trim: true },
    createdByName: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ClientLinkDocument = InferSchemaType<typeof clientLinkSchema>;
export const ClientLinkModel: Model<ClientLinkDocument> = model<ClientLinkDocument>(
  'ClientLink',
  clientLinkSchema,
);
