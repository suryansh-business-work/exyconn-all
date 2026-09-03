import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Whether we are still buying from them. */
export const SUPPLIER_STATUSES = ['ACTIVE', 'ON_HOLD', 'INACTIVE'] as const;

/**
 * Somebody we buy stock from. `code` is the short reference that appears on a
 * purchase order, so it is unique — two suppliers under one code makes a receipt
 * impossible to attribute.
 */
const supplierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    contactName: { type: String, default: '', trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    status: { type: String, enum: SUPPLIER_STATUSES, required: true, default: 'ACTIVE' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export type SupplierDocument = InferSchemaType<typeof supplierSchema>;
export const SupplierModel: Model<SupplierDocument> = model<SupplierDocument>(
  'Supplier',
  supplierSchema,
);
