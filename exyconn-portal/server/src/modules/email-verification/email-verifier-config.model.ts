import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * How the email verifier reaches mail servers, managed in Tech > Environment Variables (DB-backed).
 * Checking a mailbox means speaking SMTP on port 25, which many hosts block outbound; a SOCKS5
 * proxy that allows it is then the only way to a real answer. Reacher takes the proxy with each
 * request, so nothing about it is configured in the container. One config is active at a time.
 */
const emailVerifierConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    proxyHost: { type: String, default: '', trim: true },
    proxyPort: { type: Number, default: 1080 },
    proxyUsername: { type: String, default: '', trim: true },
    /** Write-only. */
    proxyPassword: { type: String, default: '', trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type EmailVerifierConfigDocument = InferSchemaType<typeof emailVerifierConfigSchema>;

export const EmailVerifierConfigModel: Model<EmailVerifierConfigDocument> =
  model<EmailVerifierConfigDocument>('EmailVerifierConfig', emailVerifierConfigSchema);
