import { resolveAudienceMembers } from '../../src/modules/marketing/marketing.audience';
import { CompanyModel } from '../../src/modules/crm/company.model';
import { ContactModel } from '../../src/modules/crm/contact.model';

describe('The contacts-by-account-status segment', () => {
  it('resolves to nobody when the segment has no status to match', async () => {
    await ContactModel.create({ name: 'Bo', email: 'bo@example.com', owner: 'growth@exyconn.com' });

    await expect(
      resolveAudienceMembers({ dynamicSegment: 'CONTACTS_BY_COMPANY_STATUS' }),
    ).resolves.toEqual([]);
    await expect(
      resolveAudienceMembers({ dynamicSegment: 'CONTACTS_BY_COMPANY_STATUS', segmentValue: '' }),
    ).resolves.toEqual([]);
  });

  it('resolves to nobody when no account has the requested status', async () => {
    await CompanyModel.create({
      name: 'Acme',
      domain: 'acme.com',
      status: 'PROSPECT',
      owner: 'growth@exyconn.com',
    });

    await expect(
      resolveAudienceMembers({
        dynamicSegment: 'CONTACTS_BY_COMPANY_STATUS',
        segmentValue: 'CUSTOMER',
      }),
    ).resolves.toEqual([]);
  });
});
