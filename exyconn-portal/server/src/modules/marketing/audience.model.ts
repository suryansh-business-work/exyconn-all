import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A saved set of clients a campaign can be sent to.
 *
 * Before this, every send re-picked its recipients by hand from the full client list —
 * which meant nobody could say afterwards who "the newsletter" actually goes to, and the
 * second send to the same audience was never quite the first one.
 */
const audienceListSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    /** Clients in the audience. The membership is the list; there is nothing else to it. */
    clientIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type AudienceListDocument = InferSchemaType<typeof audienceListSchema>;
export const AudienceListModel: Model<AudienceListDocument> = model<AudienceListDocument>(
  'AudienceList',
  audienceListSchema,
);
