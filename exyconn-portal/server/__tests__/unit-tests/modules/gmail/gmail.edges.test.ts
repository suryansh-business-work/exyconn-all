import { Types } from 'mongoose';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { CrmEmailMessageModel } from '../../../../src/modules/gmail/gmail.models';
import { checkedRecipients, crmEmailSender } from '../../../../src/modules/gmail/gmail.crm';
import { addressesIn, bodyTextOf, headerOf } from '../../../../src/modules/gmail/gmail.mime';
import { crmEmailThreads, toRecord } from '../../../../src/modules/gmail/gmail.sync';
import { asArg } from '../../../mockAs';
import { connectAccount, fakeGmail, saveClient } from './fakeGmail';

const SALES = 'sales@exyconn.test';
const ASHA = 'asha@acme.test';

let operatorId = '';
const asOperator = <T>(work: () => Promise<T>) => runForOrganization(operatorId, work);

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  const operator = await runAsPlatform(() =>
    OrganizationModel.create({
      name: 'Exyconn',
      slug: 'exyconn',
      currency: 'USD',
      isPlatformOperator: true,
    }),
  );
  operatorId = operator._id.toHexString();
  await saveClient();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('checkedRecipients', () => {
  const email = { to: [' Asha@Acme.test '], subject: ' Pricing ', body: 'Hi', fromAccountId: 'a' };

  it('cleans the addresses and subject, with no Cc when none is given', () => {
    expect(checkedRecipients({ ...email, cc: null })).toEqual({
      to: ['asha@acme.test'],
      cc: [],
      subject: 'Pricing',
    });
    expect(checkedRecipients({ ...email, cc: [' ', 'B@x.test'] }).cc).toEqual(['b@x.test']);
  });

  it('refuses no recipient, an invalid one, and a blank subject or message', () => {
    expect(() => checkedRecipients({ ...email, to: ['  '] })).toThrow('Enter valid email addresses.');
    expect(() => checkedRecipients({ ...email, cc: ['not-an-address'] })).toThrow(
      'Enter valid email addresses.',
    );
    expect(() => checkedRecipients({ ...email, subject: '  ' })).toThrow(
      'Write a subject and a message.',
    );
    expect(() => checkedRecipients({ ...email, body: '\n' })).toThrow(
      'Write a subject and a message.',
    );
  });
});

describe('crmEmailSender with the senders of every provider', () => {
  it('has no default when no mailbox can send', async () => {
    await expect(asOperator(() => crmEmailSender('CONTACT', 'unused', []))).resolves.toBeNull();
  });

  it('picks the first given mailbox for a record nobody wrote to yet', async () => {
    const contact = await asOperator(() =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );

    await expect(
      asOperator(() => crmEmailSender('CONTACT', contact._id.toHexString(), ['ms-1', 'gm-1'])),
    ).resolves.toBe('ms-1');
  });
});

describe('gmail mime edges', () => {
  it('reads nothing from a message without a payload or body data', () => {
    expect(bodyTextOf(undefined)).toBe('');
    expect(bodyTextOf({ mimeType: 'text/plain', body: {} })).toBe('');
    expect(headerOf(undefined, 'From')).toBe('');
    expect(headerOf({ headers: [{ name: 'from', value: 'a@x.test' }] }, 'From')).toBe('a@x.test');
  });

  it('reads bare addresses and skips anything that is not one', () => {
    expect(addressesIn('Asha <Asha@Acme.test>, b@x.test, Broken <c@x.test, undisclosed')).toEqual([
      'asha@acme.test',
      'b@x.test',
      'broken <c@x.test',
    ]);
  });
});

describe('gmail sync edges', () => {
  it('keeps a message without sender, date or snippet with blanks and the time it was read', () => {
    const before = Date.now();

    const record = toRecord({ id: 'g1', threadId: 't1' }, { id: 'a1', email: SALES });

    expect(record).toMatchObject({
      gmailId: 'g1',
      from: '',
      to: [],
      direction: 'IN',
      snippet: '',
      subject: '',
      bodyText: '',
      participants: [''],
    });
    expect(record.sentAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('groups old rows saved before accounts, subjects and dates were kept', async () => {
    fakeGmail({});
    const contact = await asOperator(() =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );
    await CrmEmailMessageModel.collection.insertMany([
        {
          organizationId: new Types.ObjectId(operatorId),
          gmailId: 'old-1',
          threadId: 't-old',
          direction: 'IN',
          participants: [ASHA],
        },
        {
          organizationId: new Types.ObjectId(operatorId),
          gmailId: 'new-1',
          threadId: 't-new',
          direction: 'IN',
          participants: [ASHA],
          accountId: 'a1',
          mailbox: SALES,
          subject: 'Pricing',
          sentAt: new Date('2026-10-01T00:00:00Z'),
        },
    ]);

    const threads = await asOperator(() =>
      crmEmailThreads('CONTACT', contact._id.toHexString()),
    );

    expect(threads.map((thread) => [thread.threadId, thread.accountId, thread.subject])).toEqual([
      ['t-new', 'a1', 'Pricing'],
      ['t-old', '', ''],
    ]);
    expect(threads[1]).toMatchObject({ mailbox: '', lastAt: new Date(0) });
  });

  it('searches a company by its addresses only when its domain is not a real one', async () => {
    await connectAccount(SALES);
    const gmail = fakeGmail({ [SALES]: { threads: {} } });
    const company = await asOperator(() =>
      CompanyModel.create({
        name: 'Local',
        domain: 'intranet',
        owner: '',
        emails: [{ address: ASHA, label: 'Work', primary: true }],
      }),
    );

    await asOperator(() => crmEmailThreads('COMPANY', company._id.toHexString()));

    expect(gmail.queries.map((query) => query.q)).toEqual([
      `from:${ASHA} OR to:${ASHA} OR cc:${ASHA}`,
    ]);
  });

  it('reads a company deleted during the sync as having no domain', async () => {
    await connectAccount(SALES);
    const gmail = fakeGmail({ [SALES]: { threads: {} } });
    const company = await asOperator(() =>
      CompanyModel.create({
        name: 'Acme',
        domain: 'acme.test',
        owner: '',
        emails: [{ address: ASHA, label: 'Work', primary: true }],
      }),
    );
    const original = CompanyModel.findById.bind(CompanyModel);
    jest
      .spyOn(CompanyModel, 'findById')
      .mockImplementationOnce((...args: Parameters<typeof original>) => original(...args))
      .mockImplementationOnce(() => asArg({ select: () => ({ lean: async () => null }) }));

    await asOperator(() => crmEmailThreads('COMPANY', company._id.toHexString()));

    expect(gmail.queries.map((query) => query.q)).toEqual([
      `from:${ASHA} OR to:${ASHA} OR cc:${ASHA}`,
    ]);
  });
});
