import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A person at a supplier who may sign in to the vendor portal (vendors.exyconn.com) with their
 * email and a one-time code — no password. Several people at one supplier may have access; each
 * sees that supplier's purchase orders and invoices.
 *
 * Not a portal user: a contact holds a vendor-portal pass that opens the vendor portal and
 * nothing else (see lib/scopedPass). The address is unique across the platform
 * (PLATFORM_UNIQUE_PATHS), so signing in never has to ask which supplier someone means.
 * Switching a contact off retires their pass at once.
 */
const vendorContactSchema = new Schema(
  {
    supplierId: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    active: { type: Boolean, required: true, default: true },
    lastSignInAt: { type: Date, default: null },
    signInCount: { type: Number, required: true, default: 0 },
    /** Raised to retire every pass issued before it. */
    tokenVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type VendorContactDocument = InferSchemaType<typeof vendorContactSchema>;

export const VendorContactModel: Model<VendorContactDocument> = model<VendorContactDocument>(
  'VendorContact',
  vendorContactSchema,
);
