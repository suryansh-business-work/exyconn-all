import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** An image in a site's media library (Website › Media), hosted on ImageKit. */
const cmsAssetSchema = new Schema(
  {
    siteId: { type: String, required: true, index: true },
    url: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    mime: { type: String, default: '', trim: true },
    size: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    alt: { type: String, default: '', trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

export type CmsAssetDocument = InferSchemaType<typeof cmsAssetSchema>;

export const CmsAssetModel: Model<CmsAssetDocument> = model<CmsAssetDocument>(
  'CmsAsset',
  cmsAssetSchema,
);
