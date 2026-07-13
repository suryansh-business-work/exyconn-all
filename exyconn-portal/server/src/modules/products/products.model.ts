import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const PRODUCT_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
    status: { type: String, enum: PRODUCT_STATUSES, required: true, default: 'DRAFT' },
  },
  { timestamps: true },
);

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel: Model<ProductDocument> = model<ProductDocument>(
  'Product',
  productSchema,
);
