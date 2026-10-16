import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { contactProfileFields } from './crm.profile';
import { contactGeoFields } from './crm.geo';

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
    companyId: { type: String, default: '', trim: true, index: true },
    companyName: { type: String, default: '', trim: true },
    status: { type: String, enum: CONTACT_STATUSES, required: true, default: 'ACTIVE' },
    owner: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    /** Values of the company's own properties (CRM > Settings > Properties), keyed by property. */
    custom: { type: Schema.Types.Mixed, default: {} },
    ...contactProfileFields,
    ...contactGeoFields,
  },
  { timestamps: true },
);

/** Finding the contact behind an address, whichever of theirs it is (timeline, Gmail, bookings). */
contactSchema.index({ 'emails.address': 1 });
contactSchema.index({ email: 1 });

export type ContactDocument = InferSchemaType<typeof contactSchema>;
export const ContactModel: Model<ContactDocument> = model<ContactDocument>(
  'Contact',
  contactSchema,
);
