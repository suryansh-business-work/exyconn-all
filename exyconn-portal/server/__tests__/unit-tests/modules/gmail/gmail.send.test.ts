import type { GraphQLError } from 'graphql';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import {
  CrmEmailMessageModel,
  GmailAccountModel,
} from '../../../../src/modules/gmail/gmail.models';
import { crmEmailSender, sendCrmEmail } from '../../../../src/modules/gmail/gmail.crm';
import { crmEmailThreads } from '../../../../src/modules/gmail/gmail.sync';
import { connectAccount, fakeGmail, gmailMessage, saveClient } from './fakeGmail';

const SALES = 'sales@exyconn.test';
const FOUNDER = 'founder@exyconn.test';
const ASHA = 'asha@acme.test';

let companyId = '';
const asCompany = <T>(work: () => Promise<T>) => runForOrganization(companyId, work);
const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'SENT',
    (error: unknown) => (error as GraphQLError).extensions?.code,
  );
const email = (fromAccountId: string, extra: Record<string, unknown> = {}) => ({
  fromAccountId,
  to: [ASHA],
  subject: 'Pricing',
  body: 'Here it is.',
  ...extra,
});

beforeEach(async () => {
  const company = await runAsPlatform(() =>
    OrganizationModel.create({ name: 'Acme', slug: 'acme', currency: 'USD' }),
  );
  companyId = company._id.toHexString();
  await saveClient();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sendCrmEmail', () => {
  it('sends from the chosen account and keeps the message with its thread and sender', async () => {
    await connectAccount(companyId, SALES);
    const founderId = await connectAccount(companyId, FOUNDER);
    const gmail = fakeGmail({ [SALES]: { threads: {} }, [FOUNDER]: { threads: {} } });

    const sent = await asCompany(() => sendCrmEmail(email(founderId), 'Ravi'));

    expect(gmail.sent).toHaveLength(1);
    expect(gmail.sent[0].mailbox).toBe(FOUNDER);
    expect(gmail.headerOf(gmail.sent[0].raw, 'From')).toBe(FOUNDER);
    expect(gmail.headerOf(gmail.sent[0].raw, 'In-Reply-To')).toBe('');
    const stored = await asCompany(() =>
      CrmEmailMessageModel.findOne({ gmailId: sent.gmailId }).lean(),
    );
    expect(stored).toMatchObject({
      threadId: 'new-thread-sent-1',
      accountId: founderId,
      mailbox: FOUNDER,
      direction: 'OUT',
      sentByName: 'Ravi',
    });
  });

  it('refuses an unknown account and one turned off for the CRM', async () => {
    const offId = await connectAccount(companyId, FOUNDER, { enabled: false });
    const gmail = fakeGmail({ [FOUNDER]: { threads: {} } });

    await expect(codeOf(asCompany(() => sendCrmEmail(email(offId), 'Ravi')))).resolves.toBe(
      'BAD_USER_INPUT',
    );
    await expect(
      codeOf(asCompany(() => sendCrmEmail(email('64b000000000000000000000'), 'Ravi'))),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(gmail.sent).toHaveLength(0);
  });

  it("never sends from another company's mailbox, and needs a company at all", async () => {
    const salesId = await connectAccount(companyId, SALES);
    const gmail = fakeGmail({ [SALES]: { threads: {} } });
    const other = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Other', slug: 'other', currency: 'USD' }),
    );

    // Company B does not see company A's mailbox, so it is not a sender it may choose.
    await expect(
      codeOf(
        runForOrganization(other._id.toHexString(), () => sendCrmEmail(email(salesId), 'Ravi')),
      ),
    ).resolves.toBe('BAD_USER_INPUT');
    // A platform administrator acting in no company has no CRM mailboxes.
    await expect(codeOf(runAsPlatform(() => sendCrmEmail(email(salesId), 'Ravi')))).resolves.toBe(
      'FORBIDDEN',
    );
    expect(gmail.sent).toHaveLength(0);
  });

  it('replies in the Gmail thread with In-Reply-To and the whole References chain', async () => {
    const salesId = await connectAccount(companyId, SALES);
    const thread = [
      gmailMessage({
        id: 'a',
        threadId: 't1',
        from: ASHA,
        to: SALES,
        subject: 'Pricing',
        at: '2026-10-01T09:00:00Z',
        messageId: '<a@acme>',
      }),
      gmailMessage({
        id: 'b',
        threadId: 't1',
        from: SALES,
        to: ASHA,
        subject: 'Re: Pricing',
        at: '2026-10-02T09:00:00Z',
        messageId: '<b@exy>',
      }),
      gmailMessage({
        id: 'c',
        threadId: 't1',
        from: ASHA,
        to: SALES,
        subject: 'Re: Pricing',
        at: '2026-10-03T09:00:00Z',
        messageId: '<c@acme>',
      }),
    ];
    const gmail = fakeGmail({ [SALES]: { threads: { t1: thread } } });
    const contact = await asCompany(() =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );
    await asCompany(() => crmEmailThreads('CONTACT', contact._id.toHexString()));

    const sent = await asCompany(() =>
      sendCrmEmail(
        email(salesId, { subject: 'Re: Pricing', threadId: 't1', inReplyTo: '<c@acme>' }),
        'Ravi',
      ),
    );

    expect(gmail.sent[0].threadId).toBe('t1');
    expect(gmail.headerOf(gmail.sent[0].raw, 'In-Reply-To')).toBe('<c@acme>');
    expect(gmail.headerOf(gmail.sent[0].raw, 'References')).toBe('<a@acme> <b@exy> <c@acme>');
    expect(sent.threadId).toBe('t1');
  });

  it('answers a thread from another account without its Gmail thread id, still threaded by headers', async () => {
    const salesId = await connectAccount(companyId, SALES);
    const founderId = await connectAccount(companyId, FOUNDER);
    const gmail = fakeGmail({
      [SALES]: {
        threads: {
          t1: [
            gmailMessage({
              id: 'a',
              threadId: 't1',
              from: ASHA,
              to: SALES,
              subject: 'Hi',
              at: '2026-10-01T09:00:00Z',
              messageId: '<a@acme>',
            }),
          ],
        },
      },
      [FOUNDER]: { threads: {} },
    });
    const contact = await asCompany(() =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );
    await asCompany(() => crmEmailThreads('CONTACT', contact._id.toHexString()));

    await asCompany(() => sendCrmEmail(email(founderId, { threadId: 't1' }), 'Ravi'));

    expect(salesId).not.toBe(founderId);
    expect(gmail.sent[0].mailbox).toBe(FOUNDER);
    expect(gmail.sent[0].threadId).toBeUndefined();
    expect(gmail.headerOf(gmail.sent[0].raw, 'In-Reply-To')).toBe('<a@acme>');
  });

  it('marks the account NEEDS_RECONNECT when Google refuses its token, and says why', async () => {
    const salesId = await connectAccount(companyId, SALES);
    fakeGmail({ [SALES]: { threads: {}, revoked: true } });

    await expect(asCompany(() => sendCrmEmail(email(salesId), 'Ravi'))).rejects.toThrow(
      'Connect it again',
    );
    const account = await runAsPlatform(() => GmailAccountModel.findById(salesId).lean());
    expect(account?.status).toBe('NEEDS_RECONNECT');
  });
});

describe('crmEmailSender', () => {
  it('prefers the enabled account that last wrote to the record, else the newest', async () => {
    const salesId = await connectAccount(companyId, SALES, { connectedAt: new Date('2026-01-01') });
    const founderId = await connectAccount(companyId, FOUNDER, {
      connectedAt: new Date('2026-02-01'),
    });
    fakeGmail({ [SALES]: { threads: {} }, [FOUNDER]: { threads: {} } });
    const contact = await asCompany(() =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );
    const id = contact._id.toHexString();

    await expect(asCompany(() => crmEmailSender('CONTACT', id))).resolves.toBe(founderId);
    await asCompany(() => sendCrmEmail(email(salesId), 'Ravi'));
    await expect(asCompany(() => crmEmailSender('CONTACT', id))).resolves.toBe(salesId);
  });
});
