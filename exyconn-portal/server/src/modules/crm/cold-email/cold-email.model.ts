import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const COLD_EMAIL_OBJECTS = ['CONTACT', 'COMPANY'] as const;
export const COLD_EMAIL_TONES = ['FRIENDLY', 'FORMAL', 'BRIEF'] as const;
export const COLD_EMAIL_STATUSES = ['DRAFT', 'SENT'] as const;

export type ColdEmailObject = (typeof COLD_EMAIL_OBJECTS)[number];
export type ColdEmailTone = (typeof COLD_EMAIL_TONES)[number];

/** One AI-written version of the email. The person may edit it before sending. */
const variantSchema = new Schema(
  {
    subject: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    /** What the person asked this version to do differently; empty for the first one. */
    instruction: { type: String, default: '', trim: true },
    tone: { type: String, enum: COLD_EMAIL_TONES, required: true },
    costUsd: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, required: true, default: Date.now },
    /** Set once this version went out; the stored email message is `sentMessageId`. */
    sentAt: { type: Date, default: null },
    sentMessageId: { type: String, default: '' },
  },
  { _id: true },
);

/**
 * A cold email being prepared for one contact or company (CRM > Cold emails): who it goes to,
 * what we are offering, and every version the AI wrote. Sending a version goes through the
 * CRM's mailboxes, so the message also lands in the record's Emails tab and timeline.
 */
const coldEmailDraftSchema = new Schema(
  {
    object: { type: String, enum: COLD_EMAIL_OBJECTS, required: true },
    recordId: { type: String, required: true, trim: true, index: true },
    /** Kept so the list reads without a join, and still reads if the record is deleted. */
    recordName: { type: String, default: '', trim: true },
    toEmail: { type: String, required: true, lowercase: true, trim: true },
    goal: { type: String, default: '', trim: true },
    tone: { type: String, enum: COLD_EMAIL_TONES, required: true, default: 'FRIENDLY' },
    variants: { type: [variantSchema], default: [] },
    status: { type: String, enum: COLD_EMAIL_STATUSES, required: true, default: 'DRAFT' },
    createdById: { type: String, required: true },
    createdByName: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ColdEmailDraftDocument = InferSchemaType<typeof coldEmailDraftSchema>;

export const ColdEmailDraftModel: Model<ColdEmailDraftDocument> = model<ColdEmailDraftDocument>(
  'ColdEmailDraft',
  coldEmailDraftSchema,
);
