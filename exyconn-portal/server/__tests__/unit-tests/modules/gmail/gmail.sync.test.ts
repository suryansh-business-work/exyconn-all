import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { GmailAccountModel } from '../../../../src/modules/gmail/gmail.models';
import { crmEmailThreads, gmailQueries } from '../../../../src/modules/gmail/gmail.sync';
import { connectAccount, fakeGmail, gmailMessage, saveClient } from './fakeGmail';

const SALES = 'sales@exyconn.test';
const FOUNDER = 'founder@exyconn.test';
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

const contact = () =>
  asOperator(() =>
    ContactModel.create({
      name: 'Asha',
      email: ASHA,
      owner: 'Ravi',
      emails: [{ address: 'asha.personal@mail.test', label: 'Personal', primary: false }],
    }),
  ).then((row) => row._id.toHexString());

const fromAsha = (id: string, threadId: string, at: string, to: string) =>
  gmailMessage({ id, threadId, from: `Asha <${ASHA}>`, to, subject: 'Pricing', at, text: id });

describe('crmEmailThreads across connected accounts', () => {
  it('merges the threads of every enabled account, newest first, each with its mailbox', async () => {
    const salesId = await connectAccount(operatorId, SALES);
    const founderId = await connectAccount(operatorId, FOUNDER);
    fakeGmail({
      [SALES]: { threads: { t1: [fromAsha('m1', 't1', '2026-10-01T09:00:00Z', SALES)] } },
      [FOUNDER]: {
        threads: {
          t9: [
            fromAsha('m2', 't9', '2026-10-05T09:00:00Z', FOUNDER),
            gmailMessage({
              id: 'm3',
              threadId: 't9',
              from: FOUNDER,
              to: ASHA,
              subject: 'Re: Pricing',
              at: '2026-10-06T09:00:00Z',
              html: '<p>Hello&nbsp;Asha</p><script>alert(1)</script>',
            }),
          ],
        },
      },
    });
    const id = await contact();

    const threads = await asOperator(() => crmEmailThreads('CONTACT', id));

    expect(threads.map((thread) => [thread.threadId, thread.accountId, thread.mailbox])).toEqual([
      ['t9', founderId, FOUNDER],
      ['t1', salesId, SALES],
    ]);
    expect(threads[0].messages.map((message) => message.direction)).toEqual(['IN', 'OUT']);
    expect(threads[0].messages[1].bodyText).toBe('Hello Asha');
  });

  it('searches Gmail for the primary and every other address of a contact', async () => {
    await connectAccount(operatorId, SALES);
    const gmail = fakeGmail({ [SALES]: { threads: {} } });
    const id = await contact();

    await asOperator(() => crmEmailThreads('CONTACT', id));

    expect(gmail.queries).toHaveLength(1);
    expect(gmail.queries[0].q).toContain(`from:${ASHA}`);
    expect(gmail.queries[0].q).toContain('cc:asha.personal@mail.test');
  });

  it('includes a company domain, but never a shared mail provider', async () => {
    await connectAccount(operatorId, SALES);
    const gmail = fakeGmail({ [SALES]: { threads: {} } });
    const acme = await asOperator(() =>
      CompanyModel.create({ name: 'Acme', domain: 'acme.test', owner: 'Ravi' }),
    );
    const free = await asOperator(() =>
      CompanyModel.create({ name: 'Solo', domain: 'gmail.com', owner: 'Ravi' }),
    );

    await asOperator(() => crmEmailThreads('COMPANY', acme._id.toHexString()));
    await asOperator(() => crmEmailThreads('COMPANY', free._id.toHexString()));

    expect(gmail.queries.map((query) => query.q)).toEqual([
      'from:@acme.test OR to:@acme.test OR cc:@acme.test',
    ]);
  });

  it('neither reads nor shows an account turned off for the CRM', async () => {
    await connectAccount(operatorId, SALES);
    const offId = await connectAccount(operatorId, FOUNDER, { enabled: false });
    const gmail = fakeGmail({
      [SALES]: { threads: {} },
      [FOUNDER]: { threads: { t2: [fromAsha('m5', 't2', '2026-10-02T09:00:00Z', FOUNDER)] } },
    });
    const id = await contact();

    const threads = await asOperator(() => crmEmailThreads('CONTACT', id));

    expect(gmail.queries.map((query) => query.mailbox)).toEqual([SALES]);
    expect(threads.some((thread) => thread.accountId === offId)).toBe(false);
  });

  it("reads only the calling company's own mailboxes", async () => {
    await connectAccount(operatorId, SALES);
    const other = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Other', slug: 'other', currency: 'USD' }),
    );
    const otherId = other._id.toHexString();
    const otherBox = 'team@other.test';
    await connectAccount(otherId, otherBox);
    const gmail = fakeGmail({
      [SALES]: { threads: { t1: [fromAsha('m1', 't1', '2026-10-01T09:00:00Z', SALES)] } },
      [otherBox]: { threads: { t7: [fromAsha('m7', 't7', '2026-10-02T09:00:00Z', otherBox)] } },
    });
    const otherContact = await runForOrganization(otherId, () =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );

    const threads = await runForOrganization(otherId, () =>
      crmEmailThreads('CONTACT', otherContact._id.toHexString()),
    );

    expect(gmail.queries.map((query) => query.mailbox)).toEqual([otherBox]);
    expect(threads.map((thread) => [thread.threadId, thread.mailbox])).toEqual([['t7', otherBox]]);
  });

  it('marks a revoked account NEEDS_RECONNECT and still returns the other accounts', async () => {
    await connectAccount(operatorId, SALES);
    const founderId = await connectAccount(operatorId, FOUNDER);
    fakeGmail({
      [SALES]: { threads: { t1: [fromAsha('m1', 't1', '2026-10-01T09:00:00Z', SALES)] } },
      [FOUNDER]: { threads: {}, revoked: true },
    });
    const id = await contact();

    const threads = await asOperator(() => crmEmailThreads('CONTACT', id));

    expect(threads.map((thread) => thread.threadId)).toEqual(['t1']);
    const founder = await runAsPlatform(() => GmailAccountModel.findById(founderId).lean());
    expect(founder?.status).toBe('NEEDS_RECONNECT');
    expect(founder?.lastError).toContain('Connect it again');
  });
});

describe('gmailQueries', () => {
  it('splits many addresses into searches of fifteen terms', () => {
    const addresses = Array.from({ length: 20 }, (_unused, n) => `p${n}@x.test`);

    const queries = gmailQueries(addresses, 'x.test');

    expect(queries).toHaveLength(2);
    expect(queries[1]).toContain('from:@x.test');
  });

  it('asks nothing for a record with no address', () => {
    expect(gmailQueries([], '')).toEqual([]);
  });
});
