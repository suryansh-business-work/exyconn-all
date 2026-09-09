import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const PRODUCT_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    /** The catalogue's natural key: two products under one SKU cannot be picked or counted apart. */
    sku: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    /** Running total kept in step with the stock movements — never edited by hand. */
    stock: { type: Number, required: true, min: 0, default: 0 },
    /** At or below this level the line is flagged as low stock. */
    reorderLevel: { type: Number, required: true, min: 0, default: 5 },
    /**
     * Weighted average of what the stock on the shelf actually cost, moved by every receipt.
     *
     * Zero until something has been received against a purchase order — a catalogue written
     * before purchasing existed has no cost basis, and guessing one from the sell price would
     * be inventing a margin.
     */
    averageCost: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: PRODUCT_STATUSES, required: true, default: 'DRAFT' },
  },
  { timestamps: true },
);

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel: Model<ProductDocument> = model<ProductDocument>(
  'Product',
  productSchema,
);
