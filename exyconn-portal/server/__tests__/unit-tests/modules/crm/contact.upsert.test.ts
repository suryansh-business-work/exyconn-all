import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import {
  contactByEmail,
  findOrCreateContact,
  logContactActivity,
} from '../../../../src/modules/crm/contact.upsert';
import { systemOrigin } from '../../../../src/modules/crm/crm.origin';

const booking = (overrides: Partial<Parameters<typeof findOrCreateContact>[0]> = {}) => ({
  name: 'Asha Rao',
  email: 'asha@acme.com',
  leadSource: 'Meeting booking',
  origin: systemOrigin('MEETING_BOOKING'),
  ...overrides,
});

describe('finding a contact by email', () => {
  it('finds a contact by its primary or any listed address, and nobody otherwise', async () => {
    const asha = await ContactModel.create({
      name: 'Asha',
      email: 'asha@acme.com',
      emails: [{ address: 'asha.rao@gmail.com' }],
      owner: 'A',
    });

    await expect(contactByEmail('asha@acme.com')).resolves.toEqual({ id: asha.id, name: 'Asha' });
    await expect(contactByEmail('asha.rao@gmail.com')).resolves.toEqual({
      id: asha.id,
      name: 'Asha',
    });
    await expect(contactByEmail('ravi@acme.com')).resolves.toBeNull();
  });
});

describe('finding or creating a contact', () => {
  it('returns the existing contact without creating another', async () => {
    const asha = await ContactModel.create({ name: 'Asha', email: 'asha@acme.com', owner: 'A' });

    await expect(findOrCreateContact(booking({ name: 'Someone else' }))).resolves.toEqual({
      id: asha.id,
      name: 'Asha',
    });
    expect(await ContactModel.countDocuments()).toBe(1);
  });

  it('creates an unowned contact with its phone and where it came from', async () => {
    const created = await findOrCreateContact(booking({ phone: '+919876543210' }));

    const row = await ContactModel.findById(created.id).lean();
    expect(created.name).toBe('Asha Rao');
    expect(row).toMatchObject({
      owner: '',
      leadSource: 'Meeting booking',
      leadOwner: 'Meeting booking',
      phone: '+919876543210',
      phones: [{ number: '+919876543210', label: 'Work', primary: true }],
      emails: [{ address: 'asha@acme.com', label: 'Work', primary: true }],
      origin: { source: 'MEETING_BOOKING' },
    });
  });

  it('creates a contact without a phone when none was given', async () => {
    const created = await findOrCreateContact(booking());

    const row = await ContactModel.findById(created.id).lean();
    expect(row?.phones).toEqual([]);
    expect(row?.phone ?? '').toBe('');
  });
});

describe('logging on a contact timeline', () => {
  it('relates the activity to the contact', async () => {
    const row = await logContactActivity(
      { id: 'c1', name: 'Asha' },
      { type: 'MEETING', subject: 'Intro call', notes: '', done: false, owner: 'Ravi' },
    );

    const stored = await ActivityModel.findById(row._id).lean();
    expect(stored).toMatchObject({
      type: 'MEETING',
      relatedType: 'CONTACT',
      relatedId: 'c1',
      relatedName: 'Asha',
      owner: 'Ravi',
    });
  });
});
