import { ActivityModel } from './activity.model';
import { ContactModel } from './contact.model';
import { stampOrigin, type RecordOrigin } from './crm.origin';

export interface ContactRef {
  id: string;
  name: string;
}

/** The CRM contact behind an address, whichever of their addresses it is; null when none. */
export async function contactByEmail(email: string): Promise<ContactRef | null> {
  const found = await ContactModel.findOne({ $or: [{ email }, { 'emails.address': email }] })
    .select('name')
    .lean();
  return found ? { id: String(found._id), name: found.name } : null;
}

export interface NewContact {
  name: string;
  email: string;
  phone?: string;
  /** Free text kept on the contact, e.g. "Meeting booking" or "Website contact form". */
  leadSource: string;
  origin: RecordOrigin;
}

/**
 * The person's CRM contact, found by any of their addresses or created when there is none.
 * Nobody owns a contact that arrived on its own: who or what brought it in is its origin.
 */
export async function findOrCreateContact(input: NewContact): Promise<ContactRef> {
  const found = await contactByEmail(input.email);
  if (found) {
    return found;
  }
  const phone = input.phone ?? '';
  const created = await ContactModel.create({
    name: input.name,
    email: input.email,
    emails: [{ address: input.email, label: 'Work', primary: true }],
    ...(phone ? { phone, phones: [{ number: phone, label: 'Work', primary: true }] } : {}),
    owner: '',
    leadSource: input.leadSource,
    ...stampOrigin(input.origin),
  });
  return { id: String(created._id), name: input.name };
}

export interface ContactActivity {
  type: 'MEETING' | 'NOTE';
  subject: string;
  notes: string;
  dueDate?: Date;
  done: boolean;
  owner: string;
}

/** Logs something that happened on a contact's timeline. */
export function logContactActivity(contact: ContactRef, activity: ContactActivity) {
  return ActivityModel.create({
    ...activity,
    relatedType: 'CONTACT',
    relatedId: contact.id,
    relatedName: contact.name,
  });
}
