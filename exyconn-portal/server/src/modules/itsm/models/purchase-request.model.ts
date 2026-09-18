import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { IT_PURCHASE_KINDS, IT_PURCHASE_STATUSES } from '../itsm.enums';

/** One vendor's price for the request. */
const quoteSchema = new Schema(
  {
    vendor: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '', trim: true },
  },
  { _id: true },
);

/**
 * A request to buy hardware, software or a service for IT, from the ask through quotes and
 * approval to the order arriving. Received hardware is then added to the asset register.
 */
const purchaseRequestSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    kind: { type: String, enum: IT_PURCHASE_KINDS, required: true, default: 'HARDWARE' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    estimatedCost: { type: Number, required: true, min: 0, default: 0 },
    /** Who it is for; empty when it is for the IT team itself. */
    requestedForName: { type: String, default: '', trim: true },
    justification: { type: String, required: true, trim: true },
    quotes: { type: [quoteSchema], default: [] },
    status: { type: String, enum: IT_PURCHASE_STATUSES, required: true, default: 'REQUESTED' },
    requestedById: { type: String, default: '', trim: true },
    decidedByName: { type: String, default: '', trim: true },
    decidedAt: { type: Date, default: null },
    decisionNote: { type: String, default: '', trim: true },
    /** The supplier's order number once it is placed. */
    orderReference: { type: String, default: '', trim: true },
    receivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ItPurchaseRequestDocument = InferSchemaType<typeof purchaseRequestSchema>;
export const ItPurchaseRequestModel: Model<ItPurchaseRequestDocument> =
  model<ItPurchaseRequestDocument>('ItPurchaseRequest', purchaseRequestSchema);
