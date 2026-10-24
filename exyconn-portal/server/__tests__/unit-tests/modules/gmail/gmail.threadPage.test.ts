import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { syncRecordEmails } from '../../../../src/modules/gmail/gmail.sync';
import {
  crmEmailThreadPage,
  type CrmEmailThreadPageInput,
} from '../../../../src/modules/gmail/gmail.threadPage';
import { connectAccount, fakeGmail, gmailMessage, saveClient } from './fakeGmail';

const SALES = 'sales@exyconn.test';
const FOUNDER = 'founder@exyconn.test';
const ASHA = 'asha@acme.test';

let operatorId = '';
const asOperator = <T>(work: () => Promise<T>) => runForOrganization(operatorId, work);

const fromAsha = (id: string, subject: string, at: string, to: string, text: string) =>
  gmailMessage({ id, threadId: id, from: ASHA, to, subject, at, text });

let contactId = '';
let founderId = '';

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
  await connectAccount(operatorId, SALES);
  founderId = await connectAccount(operatorId, FOUNDER);
  fakeGmail({
    [SALES]: {
      threads: {
        a: [fromAsha('a', 'Pricing', '2026-10-01T09:00:00Z', SALES, 'You&#39;re quoting 10 seats')],
        b: [
          fromAsha('b', 'Contract', '2026-10-05T09:00:00Z', SALES, 'Draft attached'),
          gmailMessage({
            id: 'b2',
            threadId: 'b',
            from: SALES,
            to: ASHA,
            subject: 'Re: Contract',
            at: '2026-10-06T09:00:00Z',
            text: 'Signed',
          }),
        ],
      },
    },
    [FOUNDER]: {
      threads: { c: [fromAsha('c', 'Audit', '2026-10-10T09:00:00Z', FOUNDER, 'Booked')] },
    },
  });
  contactId = await asOperator(() =>
    ContactModel.create({ name: 'Asha', email: ASHA, owner: 'Ravi' }),
  ).then((row) => row._id.toHexString());
  await asOperator(() => syncRecordEmails('CONTACT', contactId));
});

const pageOf = (input: Partial<CrmEmailThreadPageInput>) =>
  asOperator(() => crmEmailThreadPage('CONTACT', contactId, { page: 0, pageSize: 10, ...input }));
const subjects = (result: Awaited<ReturnType<typeof pageOf>>) =>
  result.rows.map((row) => row.subject);

describe('crmEmailThreadPage', () => {
  it('lists the synced threads newest first, with every mailbox and decoded previews', async () => {
    const result = await pageOf({});

    expect(subjects(result)).toEqual(['Audit', 'Contract', 'Pricing']);
    expect(result.totalCount).toBe(3);
    expect(result.mailboxes.map((box) => box.mailbox).sort((a, b) => a.localeCompare(b))).toEqual([
      FOUNDER,
      SALES,
    ]);
    expect(result.rows[2].messages[0].snippet).toBe("You're quoting 10 seats");
  });

  it('pages the list and sorts it oldest first or by subject', async () => {
    expect(subjects(await pageOf({ pageSize: 2, page: 1 }))).toEqual(['Pricing']);
    expect(subjects(await pageOf({ sort: 'OLDEST' }))).toEqual(['Pricing', 'Contract', 'Audit']);
    expect(subjects(await pageOf({ sort: 'SUBJECT' }))).toEqual(['Audit', 'Contract', 'Pricing']);
  });

  it('keeps the page size between 1 and 100 and the page at zero or more', async () => {
    expect(subjects(await pageOf({ pageSize: 0, page: -3 }))).toEqual(['Audit']);
    expect((await pageOf({ pageSize: 500 })).rows).toHaveLength(3);
  });

  it('searches subjects, bodies and addresses, whatever their case', async () => {
    expect(subjects(await pageOf({ search: '  SIGNED ' }))).toEqual(['Contract']);
    expect(subjects(await pageOf({ search: FOUNDER }))).toEqual(['Audit']);
    expect((await pageOf({ search: 'nothing like this' })).totalCount).toBe(0);
  });

  it('filters by direction, mailbox and the date of the latest message', async () => {
    expect(subjects(await pageOf({ direction: 'OUT' }))).toEqual(['Contract']);
    expect(subjects(await pageOf({ accountId: founderId }))).toEqual(['Audit']);
    expect(
      subjects(
        await pageOf({ after: '2026-10-02T00:00:00Z', before: new Date('2026-10-07T00:00:00Z') }),
      ),
    ).toEqual(['Contract']);
  });
});
