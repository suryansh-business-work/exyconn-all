import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** The pipeline, in the order a deal moves through it. */
export const DEAL_STAGES = [
  'QUALIFYING',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;

/** Stages a deal can no longer move out of; they leave the open pipeline. */
export const CLOSED_DEAL_STAGES: ReadonlySet<string> = new Set(['WON', 'LOST']);

/**
 * An opportunity. Company and contact are stored as id plus name for the same
 * reason contacts store their company that way: the board has to render a card
 * without joining, and a renamed account must not blank the card.
 */
const dealSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    companyId: { type: String, default: '', trim: true },
    companyName: { type: String, default: '', trim: true },
    contactId: { type: String, default: '', trim: true },
    contactName: { type: String, default: '', trim: true },
    stage: { type: String, enum: DEAL_STAGES, required: true, default: 'QUALIFYING' },
    value: { type: Number, required: true, min: 0, default: 0 },
    /** Percent, 0-100. Used with `value` for the weighted pipeline figure. */
    probability: { type: Number, required: true, min: 0, max: 100, default: 10 },
    expectedCloseDate: { type: Date, default: null },
    owner: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export type DealDocument = InferSchemaType<typeof dealSchema>;
export const DealModel: Model<DealDocument> = model<DealDocument>('Deal', dealSchema);
