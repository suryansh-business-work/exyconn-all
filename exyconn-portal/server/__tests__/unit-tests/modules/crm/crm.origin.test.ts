import { UserModel } from '../../../../src/modules/admin/user.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import {
  crmOriginResolvers,
  stampOrigin,
  systemOrigin,
  userOrigin,
  type RecordOrigin,
} from '../../../../src/modules/crm/crm.origin';
import { backfillCrmOrigins } from '../../../../src/modules/crm/crm.origin.backfill';
import { ROLES } from '../../../../src/constants/roles';
import { seedUser } from '../../../helpers';
import { crmUser } from '../crm-integrations/fixtures';

describe('record origins', () => {
  it('stamps the creator as lead owner, or what brought it in when nobody did', () => {
    const byHand: RecordOrigin = {
      source: 'USER',
      userId: 'u1',
      userName: 'Asha',
      userEmail: 'a@x.com',
    };
    expect(stampOrigin(byHand)).toEqual({ origin: byHand, leadOwner: 'Asha' });
    expect(stampOrigin(systemOrigin('WEBSITE'))).toEqual({
      origin: { source: 'WEBSITE', userId: '', userName: '', userEmail: '' },
      leadOwner: 'From website',
    });
  });

  it('names the signed-in creator from their account', async () => {
    const user = await seedUser('asha@exyconn.com', process.env.JWT_SECRET ?? '', [ROLES.CRM]);
    await UserModel.updateOne({ _id: user._id }, { name: 'Asha Rao' });
    const id = user._id.toHexString();

    await expect(
      userOrigin({ user: { id, roles: [ROLES.CRM], email: 'token@exyconn.com' } }, 'USER'),
    ).resolves.toEqual({
      source: 'USER',
      userId: id,
      userName: 'Asha Rao',
      userEmail: 'asha@exyconn.com',
    });
  });

  it('falls back to the token email when the account is gone', async () => {
    const ctx = crmUser();

    await expect(userOrigin(ctx, 'GOOGLE_PLACES')).resolves.toEqual({
      source: 'GOOGLE_PLACES',
      userId: ctx.user?.id,
      userName: '',
      userEmail: 'sales@exyconn.com',
    });
  });

  it('degrades a malformed id, or no caller at all, to no name', async () => {
    await expect(
      userOrigin({ user: { id: 'not-an-id', roles: [ROLES.CRM], email: 'x@exyconn.com' } }, 'USER'),
    ).resolves.toMatchObject({ userId: 'not-an-id', userName: '', userEmail: 'x@exyconn.com' });
    await expect(userOrigin({ user: null }, 'WEBSITE')).resolves.toEqual(systemOrigin('WEBSITE'));
  });

  it('reads rows saved before origins existed as having none', () => {
    const { Company, Contact } = crmOriginResolvers;
    expect(Company.origin({})).toBeNull();
    expect(Contact.leadOwner({ leadOwner: null })).toBe('');
    expect(Contact.leadOwner({ leadOwner: 'Asha' })).toBe('Asha');
    const origin = systemOrigin('WEBSITE');
    expect(Company.origin({ origin })).toBe(origin);
  });
});

describe('origin backfill', () => {
  it('gives every older record an origin from its owner and lead source', async () => {
    await CompanyModel.collection.insertMany([
      { name: 'Places Co', domain: 'places.co', owner: 'Ravi', leadSource: 'Google Places' },
      { name: 'Typed Co', domain: 'typed.co', owner: 'Asha' },
    ]);
    await ContactModel.collection.insertMany([
      { name: 'Booker', email: 'b@x.com', owner: '', leadSource: 'Meeting booking' },
      { name: 'Typed', email: 't@x.com', owner: 'Asha' },
    ]);
    const kept = await ContactModel.create({
      name: 'New',
      email: 'n@x.com',
      owner: 'Mia',
      ...stampOrigin(systemOrigin('WEBSITE')),
    });

    await backfillCrmOrigins();

    const places = await CompanyModel.findOne({ domain: 'places.co' }).lean();
    expect(places).toMatchObject({
      owner: '',
      leadOwner: 'Ravi',
      origin: { source: 'GOOGLE_PLACES', userName: 'Ravi' },
    });
    const typed = await CompanyModel.findOne({ domain: 'typed.co' }).lean();
    expect(typed).toMatchObject({ owner: 'Asha', leadOwner: 'Asha', origin: { source: 'USER' } });
    const booker = await ContactModel.findOne({ email: 'b@x.com' }).lean();
    expect(booker).toMatchObject({
      leadOwner: 'Meeting booking',
      origin: { source: 'MEETING_BOOKING', userName: '' },
    });
    const typedContact = await ContactModel.findOne({ email: 't@x.com' }).lean();
    expect(typedContact).toMatchObject({
      leadOwner: 'Asha',
      origin: { source: 'USER', userName: 'Asha' },
    });
    const untouched = await ContactModel.findById(kept._id).lean();
    expect(untouched).toMatchObject({ leadOwner: 'From website', origin: { source: 'WEBSITE' } });
  });
});
