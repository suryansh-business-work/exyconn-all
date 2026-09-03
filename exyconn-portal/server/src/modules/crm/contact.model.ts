import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** How willing the contact is to hear from us, so outreach stays lawful and welcome. */
export const CONTACT_STATUSES = ['ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'LEFT_COMPANY'] as const;

/**
 * A person at an account. The company is stored as both id and name: the id is
 * the link, the name is what the row shows, so a contact list stays readable
 * without joining and still reads correctly if the account is later renamed.
 */
const contactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    companyId: { type: String, default: '', trim: true },
    companyName: { type: String, default: '', trim: true },
    status: { type: String, enum: CONTACT_STATUSES, required: true, default: 'ACTIVE' },
    owner: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export type ContactDocument = InferSchemaType<typeof contactSchema>;
export const ContactModel: Model<ContactDocument> = model<ContactDocument>(
  'Contact',
  contactSchema,
);
