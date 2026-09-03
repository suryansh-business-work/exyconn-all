import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Whether the message reached the SMTP server. */
export const EMAIL_LOG_STATUSES = ['SENT', 'FAILED'] as const;

/**
 * Every attempt to send, kept whether it worked or not.
 *
 * A failed send is the one people actually need to see — "the customer says they never got
 * the contract" is unanswerable without it — so a failure is logged with its reason rather
 * than disappearing into the server log.
 *
 * `variables` holds what was substituted in, which is how a rendered message can be
 * explained after the fact. It is a record of what was already emailed to that address, so
 * it carries nothing the recipient was not itself sent.
 */
const emailLogSchema = new Schema(
  {
    templateKey: { type: String, required: true, trim: true, index: true },
    templateName: { type: String, default: '', trim: true },
    to: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    status: { type: String, enum: EMAIL_LOG_STATUSES, required: true },
    /** The failure reason, in the words the transport gave. Empty on success. */
    error: { type: String, default: '', trim: true },
    variables: { type: Schema.Types.Mixed, default: {} },
    /** Who or what triggered it — an email address, or the system process. */
    triggeredBy: { type: String, default: '', trim: true },
    sentAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

export type EmailLogDocument = InferSchemaType<typeof emailLogSchema>;
export const EmailLogModel: Model<EmailLogDocument> = model<EmailLogDocument>(
  'EmailLog',
  emailLogSchema,
);
