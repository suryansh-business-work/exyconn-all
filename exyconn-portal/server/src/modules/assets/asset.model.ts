import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** What kind of thing the asset is. Drives how IT groups the register. */
export const ASSET_CATEGORIES = [
  'LAPTOP',
  'DESKTOP',
  'MONITOR',
  'PHONE',
  'TABLET',
  'PERIPHERAL',
  'NETWORK',
  'SOFTWARE_LICENCE',
  'OTHER',
] as const;

/** Where the asset is in its life: in stock, with someone, being fixed, or gone. */
export const ASSET_STATUSES = ['IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'RETIRED', 'LOST'] as const;

/**
 * One item in the IT asset register. `assetTag` is the label physically stuck on
 * the item, so it is unique and is how the item is found; the serial number is the
 * manufacturer's and may be absent on a licence or a cable.
 */
const assetSchema = new Schema(
  {
    assetTag: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ASSET_CATEGORIES, required: true, default: 'LAPTOP' },
    status: { type: String, enum: ASSET_STATUSES, required: true, default: 'IN_STOCK' },
    manufacturer: { type: String, default: '', trim: true },
    modelName: { type: String, default: '', trim: true },
    serialNumber: { type: String, default: '', trim: true },
    /** Employee currently holding the asset. Empty whenever the status is not ASSIGNED. */
    assignedToId: { type: String, default: '', trim: true },
    assignedToName: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    purchaseDate: { type: Date, default: null },
    warrantyExpiry: { type: Date, default: null },
    purchaseCost: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export type AssetDocument = InferSchemaType<typeof assetSchema>;
export const AssetModel: Model<AssetDocument> = model<AssetDocument>('Asset', assetSchema);
