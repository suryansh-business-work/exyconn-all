import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { enabledMailboxes } from '../../../../src/modules/gmail/gmail.accounts';
import { GmailAccountModel } from '../../../../src/modules/gmail/gmail.models';
import { CrmMailThreadModel } from '../../../../src/modules/crm-mail/crm-mail.models';
import { syncMailbox } from '../../../../src/modules/crm-mail/crm-mail.sync';
import {
  clearMailSearchCache,
  listMailThreads,
} from '../../../../src/modules/crm-mail/crm-mail.list';
import { GMAIL_API_DISABLED } from '../../../../src/modules/crm-mail/crm-mail.errors';
import { connectAccount, saveClient } from '../gmail/fakeGmail';
import { fakeMail, mailMessage, type FakeMailbox } from './fakeMail';

const SALES = 'sales@exyconn.test';
const ASHA = 'asha@acme.test';

let operatorId = '';
const asOperator = <T>(work: () => Promise<T>) => runForOrganization(operatorId, work);

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  clearMailSearchCache();
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

const fromAsha = (id: string, at: string, labels: string[], subject = 'Pricing') =>
  mailMessage({
    id,
    threadId: id,
    from: `"Kumar, Asha" <${ASHA}>`,
    to: SALES,
    subject,
    at,
    labels,
    text: 'Hello',
    snippet: 'You&#39;re invited &amp; welcome',
  });

/** Sales holds an unread inbox thread from Asha, a starred sent one, and an archived one. */
function salesBox(): FakeMailbox {
  return {
    threads: {
      t1: {
        historyId: '10',
        messages: [fromAsha('t1', '2026-10-05T09:00:00Z', ['INBOX', 'UNREAD'])],
      },
      t2: {
        historyId: '20',
        messages: [
          mailMessage({
            id: 't2',
            threadId: 't2',
            from: SALES,
            to: 'buyer@globex.test',
            subject: 'Proposal',
            at: '2026-10-04T09:00:00Z',
            labels: ['SENT', 'STARRED'],
            text: 'Attached',
          }),
        ],
      },
      t3: {
        historyId: '30',
        messages: [fromAsha('t3', '2026-10-01T09:00:00Z', [], 'Old invoice')],
      },
    },
  };
}

const mailbox = async () => (await asOperator(() => enabledMailboxes()))[0];
const folder = (name: 'INBOX' | 'SENT' | 'STARRED' | 'ALL', search = '') =>
  asOperator(async () =>
    listMailThreads([await mailbox()], { folder: name, search, page: 0, pageSize: 25 }),
  );
const threadIdsOf = (page: { rows: Array<{ threadId: string }> }) =>
  page.rows.map((row) => row.threadId);

describe('syncing a mailbox into CRM > Mail', () => {
  it('reads every folder into the list with its read, starred and preview state', async () => {
    await connectAccount(operatorId, SALES);
    fakeMail({ [SALES]: salesBox() });

    const outcome = await asOperator(async () => syncMailbox(await mailbox()));

    expect(outcome).toMatchObject({ email: SALES, error: '', skipped: false });
    expect(threadIdsOf(await folder('INBOX'))).toEqual(['t1']);
    expect(threadIdsOf(await folder('SENT'))).toEqual(['t2']);
    expect(threadIdsOf(await folder('STARRED'))).toEqual(['t2']);
    expect(threadIdsOf(await folder('ALL'))).toEqual(['t1', 't2', 't3']);
    const [inbox] = (await folder('INBOX')).rows;
    expect(inbox).toMatchObject({
      unread: true,
      starred: false,
      fromName: 'Kumar, Asha',
      fromAddress: ASHA,
      snippet: "You're invited & welcome",
      subject: 'Pricing',
    });
  });

  it('syncs a mailbox at most every 30 seconds, then reads only conversations that changed', async () => {
    const id = await connectAccount(operatorId, SALES);
    const box = salesBox();
    const gmail = fakeMail({ [SALES]: box });
    await asOperator(async () => syncMailbox(await mailbox()));

    const again = await asOperator(async () => syncMailbox(await mailbox()));
    expect(again.skipped).toBe(true);

    await asOperator(() =>
      GmailAccountModel.updateOne({ _id: id }, { $set: { mailSyncedAt: new Date(0) } }),
    );
    box.threads.t1.historyId = '11';
    box.threads.t1.messages[0].labelIds = [];
    gmail.calls.length = 0;
    await asOperator(async () => syncMailbox(await mailbox()));

    const reads = gmail.calls.filter((call) => /^\/threads\/[^/]+$/.test(call.path));
    expect(reads.map((call) => call.path)).toEqual(['/threads/t1']);
    // Archived in Gmail: it left the inbox here too.
    expect(threadIdsOf(await folder('INBOX'))).toEqual([]);
  });

  it('keeps the reason a sync failed, in words that say how to fix it', async () => {
    await connectAccount(operatorId, SALES);
    const body =
      '{"error":{"code":403,"message":"Gmail API has not been used in project 42 before or it is disabled.","status":"PERMISSION_DENIED","details":[{"reason":"SERVICE_DISABLED"}]}}';
    fakeMail({ [SALES]: { threads: {}, failWith: { status: 403, body } } });

    const outcome = await asOperator(async () => syncMailbox(await mailbox()));

    expect(outcome).toMatchObject({ error: GMAIL_API_DISABLED, skipped: false, syncedAt: null });
    const account = await asOperator(() => GmailAccountModel.findOne({ email: SALES }).lean());
    expect(account?.mailSyncedAt).toBeNull();
    expect(account?.lastError).toContain('SERVICE_DISABLED');
  });
});

describe('listing CRM > Mail', () => {
  it('finds older mail through Gmail search and links each conversation to its record', async () => {
    await connectAccount(operatorId, SALES);
    const box = salesBox();
    fakeMail({ [SALES]: box });
    await asOperator(async () => {
      await ContactModel.create({ name: 'Asha Kumar', email: ASHA, owner: 'Ravi' });
      await CompanyModel.create({ name: 'Globex', domain: 'globex.test' });
      await syncMailbox(await mailbox());
    });
    // Beyond the synced pages: only Gmail's own search reaches it.
    box.threads.t9 = {
      historyId: '90',
      messages: [fromAsha('t9', '2025-01-01T09:00:00Z', [], 'Invoice 2025')],
    };

    const found = await folder('ALL', 'invoice');

    expect(threadIdsOf(found)).toEqual(['t3', 't9']);
    expect(found.rows[0].record).toMatchObject({ object: 'CONTACT', name: 'Asha Kumar' });
    const sent = await folder('SENT');
    expect(sent.rows[0].record).toMatchObject({ object: 'COMPANY', name: 'Globex' });
    expect(await asOperator(() => CrmMailThreadModel.countDocuments())).toBe(4);
  });

  it('pages the folder and reports a mailbox Gmail search could not reach', async () => {
    await connectAccount(operatorId, SALES);
    const box = salesBox();
    fakeMail({ [SALES]: box });
    await asOperator(async () => syncMailbox(await mailbox()));
    box.failWith = { status: 429, body: 'rateLimitExceeded' };

    const page = await asOperator(async () =>
      listMailThreads([await mailbox()], { folder: 'ALL', search: 'asha', page: 0, pageSize: 1 }),
    );

    expect(page.totalCount).toBe(2);
    expect(threadIdsOf(page)).toEqual(['t1']);
    expect(page.warnings).toEqual([
      `Gmail is limiting requests from ${SALES}. Wait a minute and try again.`,
    ]);
  });
});

describe('sorting and filtering CRM > Mail', () => {
  const all = (input: Partial<Parameters<typeof listMailThreads>[1]>) =>
    asOperator(async () =>
      listMailThreads([await mailbox()], { folder: 'ALL', page: 0, pageSize: 25, ...input }),
    );

  beforeEach(async () => {
    await connectAccount(operatorId, SALES);
    fakeMail({ [SALES]: salesBox() });
    await asOperator(async () => syncMailbox(await mailbox()));
  });

  it('sorts newest first by default, or oldest first, by subject or by sender', async () => {
    expect(threadIdsOf(await all({}))).toEqual(['t1', 't2', 't3']);
    expect(threadIdsOf(await all({ sort: 'OLDEST' }))).toEqual(['t3', 't2', 't1']);
    expect(threadIdsOf(await all({ sort: 'SUBJECT' }))).toEqual(['t3', 't1', 't2']);
    expect(threadIdsOf(await all({ sort: 'SENDER' }))[0]).toBe('t2');
  });

  it('keeps only unread conversations, or those in a date range', async () => {
    expect(threadIdsOf(await all({ unreadOnly: true }))).toEqual(['t1']);
    expect(
      threadIdsOf(
        await all({ after: '2026-10-02T00:00:00Z', before: new Date('2026-10-04T23:00:00Z') }),
      ),
    ).toEqual(['t2']);
    expect((await all({ withAttachments: true })).totalCount).toBe(0);
  });
});
