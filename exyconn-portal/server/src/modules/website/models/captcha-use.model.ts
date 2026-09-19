import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A website captcha that has been answered — right or wrong. Recording it is what makes each
 * question good for one attempt; Mongo drops the record once the question would have expired.
 */
const websiteCaptchaUseSchema = new Schema({
  nonce: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export type WebsiteCaptchaUseDocument = InferSchemaType<typeof websiteCaptchaUseSchema>;
export const WebsiteCaptchaUseModel: Model<WebsiteCaptchaUseDocument> =
  model<WebsiteCaptchaUseDocument>('WebsiteCaptchaUse', websiteCaptchaUseSchema);
