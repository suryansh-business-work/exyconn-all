import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A reusable image-upload provider configuration (ImageKit) managed from the
 * Tech module (DB-backed, no env dependency). Exactly one document is `isActive`
 * at a time and is used for avatar/image uploads.
 */
const imageConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    provider: { type: String, required: true, default: 'imagekit', trim: true },
    publicKey: { type: String, required: true, trim: true },
    privateKey: { type: String, required: true },
    urlEndpoint: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type ImageConfigDocument = InferSchemaType<typeof imageConfigSchema>;

export const ImageConfigModel: Model<ImageConfigDocument> = model<ImageConfigDocument>(
  'ImageConfig',
  imageConfigSchema,
);
