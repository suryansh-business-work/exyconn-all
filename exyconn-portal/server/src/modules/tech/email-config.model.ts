import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A reusable SMTP/email configuration managed from the Tech module (DB-backed,
 * no env dependency). Exactly one document is `isActive` at a time and is used
 * by the mailer for outgoing transactional email.
 */
const emailConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    host: { type: String, required: true, trim: true },
    port: { type: Number, required: true, default: 587 },
    secure: { type: Boolean, required: true, default: false },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    fromAddress: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type EmailConfigDocument = InferSchemaType<typeof emailConfigSchema>;

export const EmailConfigModel: Model<EmailConfigDocument> = model<EmailConfigDocument>(
  'EmailConfig',
  emailConfigSchema,
);
