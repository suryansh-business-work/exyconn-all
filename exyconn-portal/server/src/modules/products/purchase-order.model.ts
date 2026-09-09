import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Where a purchase order stands.
 *
 * DRAFT and ORDERED are chosen by a person; the two RECEIVED states follow from the goods
 * actually arriving, and are written by `receivePurchaseOrder` rather than typed. Nobody
 * marks a PO received by hand — that is how stock exists on a screen and not on a shelf.
 */
export const PURCHASE_ORDER_STATUSES = [
  'DRAFT',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
] as const;

/**
 * One ordered line.
 *
 * `unitCost` is what makes this worth having: stock used to appear from nowhere with no cost
 * basis, so inventory could only be valued at the price we hoped to sell it for. A receipt
 * carries this cost onto the stock movement, and the product's average cost follows from it.
 */
const purchaseOrderLineSchema = new Schema(
  {
    productId: { type: String, required: true, trim: true },
    /** Denormalised on write, so the grid and the PDF never join to read it. */
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, required: true, min: 0, default: 0 },
    /** How many have actually arrived. Written only by a receipt; never by the form. */
    receivedQuantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

/** What we have ordered from a supplier, and how much of it has turned up. */
const purchaseOrderSchema = new Schema(
  {
    /** Drawn from the shared counter, so the series has no gaps and no repeats. */
    number: { type: String, required: true, unique: true, trim: true },
    supplierId: { type: String, required: true, trim: true },
    supplierName: { type: String, default: '', trim: true },
    lines: { type: [purchaseOrderLineSchema], default: [] },
    currency: { type: String, required: true, default: 'INR', trim: true },
    status: {
      type: String,
      enum: PURCHASE_ORDER_STATUSES,
      required: true,
      default: 'DRAFT',
    },
    orderDate: { type: Date, required: true },
    /** When the supplier said it would arrive. Null when nobody asked. */
    expectedDate: { type: Date, default: null },
    notes: { type: String, default: '' },
    /** Set the first time any line is received, so "when did this start arriving" is answerable. */
    firstReceivedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];
export type PurchaseOrderDocument = InferSchemaType<typeof purchaseOrderSchema>;
export const PurchaseOrderModel: Model<PurchaseOrderDocument> = model<PurchaseOrderDocument>(
  'PurchaseOrder',
  purchaseOrderSchema,
);
