import type { GraphQLError } from 'graphql';
import { Types } from 'mongoose';
import { ROLES } from '../../../../src/constants/roles';
import { assertPermission } from '../../../../src/lib/permissions';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { AuditLogModel } from '../../../../src/modules/audit';
import { GMAIL_AUDIT_MODULE } from '../../../../src/modules/gmail/gmail.audit';
import { sendCrmEmail } from '../../../../src/modules/gmail/gmail.crm';
import { CrmMailThreadModel } from '../../../../src/modules/crm-mail/crm-mail.models';
import { crmMailResolvers } from '../../../../src/modules/crm-mail/crm-mail.resolvers';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { connectAccount, saveClient } from '../gmail/fakeGmail';
import { fakeMail, mailMessage, type FakeMailbox } from './fakeMail';

jest.mock('../../../../src/lib/permissions', () => ({
  ...jest.requireActual('../../../../src/lib/permissions'),
  assertPermission: jest.fn(async (ctx: GraphQLContext) => ctx.user),
}));

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Query = crmMailResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = crmMailResolvers.Mutation as unknown as Record<string, Resolver>;

const ctx: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'ravi@exyconn.test' },
};
const SALES = 'sales@exyconn.test';
const ASHA = 'asha@acme.test';

let operatorId = '';
let salesId = '';
const asOperator = <T>(work: () => Promise<T>) => runForOrganization(operatorId, work);
const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'OK',
    (error: unknown) => (error as GraphQLError).extensions?.code,
  );

function salesBox(): FakeMailbox {
  return {
    threads: {
      t1: {
        historyId: '1',
        messages: [
          mailMessage({
            id: 'm1',
            threadId: 't1',
            from: `Asha <${ASHA}>`,
            to: SALES,
            cc: 'ops@acme.test',
            subject: 'Contract',
            at: '2026-10-05T09:00:00Z',
            labels: ['INBOX', 'UNREAD'],
            html: '<p onclick="steal()">Signed<script>alert(1)</script></p>',
            attachment: { id: 'a1', filename: 'contract.pdf', size: 9 },
          }),
          mailMessage({
            id: 'm2',
            threadId: 't1',
            from: SALES,
            to: ASHA,
            bcc: 'boss@exyconn.test',
            subject: 'Re: Contract',
            at: '2026-10-06T09:00:00Z',
            labels: ['SENT'],
            text: 'Thanks',
          }),
        ],
      },
      t2: {
        historyId: '2',
        messages: [
          mailMessage({
            id: 'm3',
            threadId: 't2',
            from: ASHA,
            to: SALES,
            subject: 'Lunch',
            at: '2026-10-07T09:00:00Z',
            labels: ['INBOX'],
            text: 'Lunch?',
          }),
        ],
      },
    },
  };
}

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
  salesId = await connectAccount(operatorId, SALES);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const sync = () => asOperator(async () => Mutation.syncCrmMail(null, {}, ctx));

describe('CRM > Mail resolvers', () => {
  it('lists the mailboxes with unread counts per mailbox and folder, for CRM Activity viewers', async () => {
    fakeMail({ [SALES]: salesBox() });
    await sync();

    const overview = (await asOperator(async () => Query.crmMailOverview(null, {}, ctx))) as {
      mailboxes: Array<Record<string, unknown>>;
      folders: Array<{ folder: string; unread: number }>;
    };

    expect(assertPermission).toHaveBeenCalledWith(ctx, 'Activity', [ROLES.CRM], 'VIEW');
    expect(overview.mailboxes).toEqual([
      expect.objectContaining({ id: salesId, provider: 'GMAIL', readable: true, unreadCount: 1 }),
    ]);
    expect(overview.folders).toEqual([
      { folder: 'INBOX', unread: 1 },
      { folder: 'SENT', unread: 1 },
      { folder: 'STARRED', unread: 0 },
      { folder: 'ALL', unread: 1 },
    ]);
  });

  it('opens a conversation with sanitized HTML, every recipient and its attachments', async () => {
    fakeMail({ [SALES]: salesBox() });

    const thread = (await asOperator(async () =>
      Query.crmMailThread(null, { accountId: salesId, threadId: 't1' }, ctx),
    )) as { id: string; labelIds: string[]; messages: Array<Record<string, unknown>> };

    expect(thread.id).toBe(`${salesId}:t1`);
    expect(crmMailResolvers.CrmMailThread.inbox(thread)).toBe(true);
    const [first, second] = thread.messages;
    expect(first).toMatchObject({
      fromName: 'Asha',
      fromAddress: ASHA,
      cc: ['ops@acme.test'],
      direction: 'IN',
      html: '<p>Signed</p>',
      text: 'Signed',
      attachments: [
        {
          id: 'a1',
          messageId: 'm1',
          filename: 'contract.pdf',
          mimeType: 'application/pdf',
          size: 9,
        },
      ],
    });
    expect(second).toMatchObject({ direction: 'OUT', bcc: ['boss@exyconn.test'], html: '' });

    const file = (await asOperator(async () =>
      Query.crmMailAttachment(
        null,
        { accountId: salesId, messageId: 'm1', attachmentId: 'a1' },
        ctx,
      ),
    )) as { data: string };
    expect(Buffer.from(file.data, 'base64').toString('utf8')).toBe('file a1');
  });

  it('marks read in Gmail and the list, and audits a trash with the DELETE right', async () => {
    const box = salesBox();
    fakeMail({ [SALES]: box });
    await sync();
    const both = [
      { accountId: salesId, threadId: 't1' },
      { accountId: salesId, threadId: 't2' },
    ];

    const read = await asOperator(async () =>
      Mutation.crmMailThreadAction(null, { threads: both, action: 'MARK_READ' }, ctx),
    );
    expect(read).toBe(2);
    expect(box.threads.t1.messages[0].labelIds).not.toContain('UNREAD');
    expect(await asOperator(() => CrmMailThreadModel.countDocuments({ unread: true }))).toBe(0);

    await asOperator(async () =>
      Mutation.crmMailThreadAction(null, { threads: [both[1]], action: 'TRASH' }, ctx),
    );
    expect(assertPermission).toHaveBeenCalledWith(ctx, 'Activity', [ROLES.CRM], 'DELETE');
    expect(box.threads.t2).toBeUndefined();
    expect(await asOperator(() => CrmMailThreadModel.countDocuments())).toBe(1);
    const audits = await asOperator(() =>
      AuditLogModel.find({ module: GMAIL_AUDIT_MODULE }).lean(),
    );
    expect(audits.map((row) => [row.action, row.summary])).toEqual([
      ['DELETE', `Moved to Gmail trash: 1 conversation(s) in ${SALES}`],
    ]);
  });

  it('refuses a mailbox that is not turned on, and explains a Gmail refusal', async () => {
    const box = salesBox();
    fakeMail({ [SALES]: box });
    const stranger = [{ accountId: new Types.ObjectId().toHexString(), threadId: 't1' }];

    expect(
      await codeOf(
        asOperator(async () =>
          Mutation.crmMailThreadAction(null, { threads: stranger, action: 'STAR' }, ctx),
        ),
      ),
    ).toBe('BAD_USER_INPUT');

    box.failWith = { status: 404, body: 'gone' };
    await expect(
      asOperator(async () =>
        Mutation.crmMailThreadAction(
          null,
          { threads: [{ accountId: salesId, threadId: 't1' }], action: 'ARCHIVE' },
          ctx,
        ),
      ),
    ).rejects.toThrow('That conversation is no longer in Gmail');
  });

  it('threads a reply to a conversation only CRM > Mail knows, from its own mailbox', async () => {
    const gmail = fakeMail({ [SALES]: salesBox() });
    await sync();

    await asOperator(() =>
      sendCrmEmail(
        {
          fromAccountId: salesId,
          to: [ASHA],
          subject: 'Re: Contract',
          body: 'Done',
          threadId: 't1',
        },
        'Ravi',
      ),
    );

    expect(gmail.sent[0].threadId).toBe('t1');
    expect(gmail.sent[0].raw).toContain('In-Reply-To: <m2@mail.test>');
    expect(gmail.sent[0].raw).toContain('References: <m1@mail.test> <m2@mail.test>');
  });
});
