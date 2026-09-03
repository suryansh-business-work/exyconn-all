import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Why the stock changed. RECEIPT and RETURN add, ISSUE and WRITE_OFF remove, and
 * COUNT is a stocktake that sets the level to what was actually on the shelf.
 */
export const MOVEMENT_REASONS = ['RECEIPT', 'ISSUE', 'RETURN', 'WRITE_OFF', 'COUNT'] as const;

/** Reasons whose quantity is taken off the shelf rather than added to it. */
export const OUTGOING_REASONS: ReadonlySet<string> = new Set(['ISSUE', 'WRITE_OFF']);

/**
 * One change to a product's stock. Movements are the record; the product's
 * `stock` is the running total kept in step with them, so a level can always be
 * explained by the rows that produced it.
 */
const stockMovementSchema = new Schema(
  {
    productId: { type: String, required: true, index: true, trim: true },
    productName: { type: String, required: true, trim: true },
    reason: { type: String, enum: MOVEMENT_REASONS, required: true, default: 'RECEIPT' },
    /** Always positive. The reason decides which way it moves the level. */
    quantity: { type: Number, required: true, min: 1 },
    /** The level after this movement, so history reads without replaying it. */
    stockAfter: { type: Number, required: true, min: 0 },
    supplierId: { type: String, default: '', trim: true },
    supplierName: { type: String, default: '', trim: true },
    reference: { type: String, default: '', trim: true },
    notes: { type: String, default: '' },
    recordedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type StockMovementDocument = InferSchemaType<typeof stockMovementSchema>;
export const StockMovementModel: Model<StockMovementDocument> = model<StockMovementDocument>(
  'StockMovement',
  stockMovementSchema,
);
