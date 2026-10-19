import type { GraphQLError } from 'graphql';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
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

let operatorId = '';
const asOperator = <T>(work: () => Promise<T>) => runForOrganization(operatorId, work);
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

describe('sendCrmEmail', () => {
  it('sends from the chosen account and keeps the message with its thread and sender', async () => {
    await connectAccount(SALES);
    const founderId = await connectAccount(FOUNDER);
    const gmail = fakeGmail({ [SALES]: { threads: {} }, [FOUNDER]: { threads: {} } });

    const sent = await asOperator(() => sendCrmEmail(email(founderId), 'Ravi'));

    expect(gmail.sent).toHaveLength(1);
    expect(gmail.sent[0].mailbox).toBe(FOUNDER);
    expect(gmail.headerOf(gmail.sent[0].raw, 'From')).toBe(FOUNDER);
    expect(gmail.headerOf(gmail.sent[0].raw, 'In-Reply-To')).toBe('');
    const stored = await asOperator(() =>
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
    const offId = await connectAccount(FOUNDER, { enabled: false });
    const gmail = fakeGmail({ [FOUNDER]: { threads: {} } });

    await expect(codeOf(asOperator(() => sendCrmEmail(email(offId), 'Ravi')))).resolves.toBe(
      'BAD_USER_INPUT',
    );
    await expect(
      codeOf(asOperator(() => sendCrmEmail(email('64b000000000000000000000'), 'Ravi'))),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(gmail.sent).toHaveLength(0);
  });

  it('refuses a customer company, whose CRM never reaches the operator mail', async () => {
    const salesId = await connectAccount(SALES);
    fakeGmail({ [SALES]: { threads: {} } });
    const customer = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Customer', slug: 'customer', currency: 'USD' }),
    );

    await expect(
      codeOf(
        runForOrganization(customer._id.toHexString(), () => sendCrmEmail(email(salesId), 'Ravi')),
      ),
    ).resolves.toBe('FORBIDDEN');
  });

  it('replies in the Gmail thread with In-Reply-To and the whole References chain', async () => {
    const salesId = await connectAccount(SALES);
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
    const contact = await asOperator(() =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );
    await asOperator(() => crmEmailThreads('CONTACT', contact._id.toHexString()));

    const sent = await asOperator(() =>
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
    const salesId = await connectAccount(SALES);
    const founderId = await connectAccount(FOUNDER);
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
    const contact = await asOperator(() =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );
    await asOperator(() => crmEmailThreads('CONTACT', contact._id.toHexString()));

    await asOperator(() => sendCrmEmail(email(founderId, { threadId: 't1' }), 'Ravi'));

    expect(salesId).not.toBe(founderId);
    expect(gmail.sent[0].mailbox).toBe(FOUNDER);
    expect(gmail.sent[0].threadId).toBeUndefined();
    expect(gmail.headerOf(gmail.sent[0].raw, 'In-Reply-To')).toBe('<a@acme>');
  });

  it('marks the account NEEDS_RECONNECT when Google refuses its token, and says why', async () => {
    const salesId = await connectAccount(SALES);
    fakeGmail({ [SALES]: { threads: {}, revoked: true } });

    await expect(asOperator(() => sendCrmEmail(email(salesId), 'Ravi'))).rejects.toThrow(
      'Connect it again',
    );
    const account = await runAsPlatform(() => GmailAccountModel.findById(salesId).lean());
    expect(account?.status).toBe('NEEDS_RECONNECT');
  });
});

describe('crmEmailSender', () => {
  it('prefers the enabled account that last wrote to the record, else the newest', async () => {
    const salesId = await connectAccount(SALES, { connectedAt: new Date('2026-01-01') });
    const founderId = await connectAccount(FOUNDER, { connectedAt: new Date('2026-02-01') });
    fakeGmail({ [SALES]: { threads: {} }, [FOUNDER]: { threads: {} } });
    const contact = await asOperator(() =>
      ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
    );
    const id = contact._id.toHexString();

    await expect(asOperator(() => crmEmailSender('CONTACT', id))).resolves.toBe(founderId);
    await asOperator(() => sendCrmEmail(email(salesId), 'Ravi'));
    await expect(asOperator(() => crmEmailSender('CONTACT', id))).resolves.toBe(salesId);
  });
});
