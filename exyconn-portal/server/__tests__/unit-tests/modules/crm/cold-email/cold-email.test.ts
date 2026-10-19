import { Types } from 'mongoose';
import { runAssistJob } from '../../../../../src/modules/ai/ai.actions';
import { sendFromAnyMailbox } from '../../../../../src/modules/crm-integrations/crm-integrations.email';
import { coldEmailResolvers } from '../../../../../src/modules/crm/cold-email/cold-email.resolvers';
import { ColdEmailDraftModel } from '../../../../../src/modules/crm/cold-email/cold-email.model';
import { ActivityModel } from '../../../../../src/modules/crm/activity.model';
import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { WebScrapeModel } from '../../../../../src/modules/web-scraper/web-scrape.model';
import { AuditLogModel } from '../../../../../src/modules/audit/audit.model';
import { registeredBulkTarget } from '../../../../../src/modules/table-transfer/registry';
import { ROLES, type Role } from '../../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../../src/middleware/auth';
import { useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';

// The model and the mailbox are external; what the CRM hands them and keeps is under test.
jest.mock('../../../../../src/modules/ai/ai.actions', () => ({ runAssistJob: jest.fn() }));
jest.mock('../../../../../src/modules/crm-integrations/crm-integrations.email', () => ({
  ...jest.requireActual('../../../../../src/modules/crm-integrations/crm-integrations.email'),
  sendFromAnyMailbox: jest.fn(),
}));

const ORGANIZATION = useTestOrganization();
const { Query, Mutation, ColdEmailDraft, ColdEmailVariant } = coldEmailResolvers;
const ai = jest.mocked(runAssistJob);
const send = jest.mocked(sendFromAnyMailbox);

const ctxAs = (roles: Role[]): GraphQLContext => ({
  user: {
    id: new Types.ObjectId().toHexString(),
    email: 'asha@exyconn.com',
    roles,
    organizationId: ORGANIZATION,
  },
  organizationId: ORGANIZATION,
});
const crm = () => ctxAs([ROLES.CRM]);

const answer = (response: string, costUsd = 0.01) =>
  ({ response, costUsd }) as unknown as Awaited<ReturnType<typeof runAssistJob>>;
const email = (subject: string, body = 'Hi Acme team,\n\nShort note.\n\nAsha') =>
  answer(JSON.stringify({ subject, body }));
const promptOf = (call: number) => ai.mock.calls[call][1];

const seedAcme = () =>
  CompanyModel.create({
    name: 'Acme',
    domain: 'acme.com',
    website: 'https://www.acme.com',
    industry: 'Retail',
    city: 'Pune',
    country: 'India',
    description: 'Chain of grocery stores.',
    emails: [{ address: 'hello@acme.com', primary: true }],
  });

async function draftFor(subject = 'Faster checkouts at Acme') {
  const acme = await seedAcme();
  ai.mockResolvedValueOnce(email(subject));
  const draft = await Mutation.createColdEmailDraft(
    null,
    {
      input: {
        object: 'COMPANY',
        recordId: acme.id,
        toEmail: 'HELLO@acme.com',
        goal: 'our checkout software',
        tone: 'FRIENDLY',
      },
    },
    crm(),
  );
  return { acme, draft };
}

afterEach(() => {
  ai.mockReset();
  send.mockReset();
});

describe('drafting a cold email', () => {
  it('writes the first version from the business context and notes it on the timeline', async () => {
    const acme = await seedAcme();
    await WebScrapeModel.create({
      url: 'https://acme.com/',
      markdown: 'We run 40 stores across Maharashtra.',
      charCount: 36,
      createdById: 'u1',
    });
    await ActivityModel.create({
      type: 'CALL',
      subject: 'Intro call',
      relatedType: 'COMPANY',
      relatedId: acme.id,
      owner: 'Asha',
      done: true,
    });
    ai.mockResolvedValueOnce(email('Faster checkouts at Acme'));

    const draft = await Mutation.createColdEmailDraft(
      null,
      {
        input: {
          object: 'COMPANY',
          recordId: acme.id,
          toEmail: 'hello@acme.com',
          goal: 'our checkout software',
          tone: 'FORMAL',
        },
      },
      crm(),
    );

    expect(draft).toMatchObject({
      recordName: 'Acme',
      toEmail: 'hello@acme.com',
      status: 'DRAFT',
      createdByName: 'asha@exyconn.com',
    });
    expect(draft.variants).toHaveLength(1);
    expect(draft.variants[0]).toMatchObject({ subject: 'Faster checkouts at Acme', costUsd: 0.01 });
    expect(ai.mock.calls[0][0]).toBe('Draft cold email');
    const prompt = promptOf(0);
    expect(prompt).toContain('from asha@exyconn.com at Test Co to Acme');
    expect(prompt).toContain('What we are offering: our checkout software');
    expect(prompt).toContain('Industry: Retail');
    expect(prompt).toContain('Location: Pune, India');
    expect(prompt).toContain('CALL: Intro call');
    expect(prompt).toContain('We run 40 stores across Maharashtra.');
    expect(prompt).toContain('Polite and professional');

    const note = await ActivityModel.findOne({ relatedId: acme.id, type: 'NOTE' }).lean();
    expect(note).toMatchObject({
      subject: 'Cold email drafted',
      notes: 'To hello@acme.com: Faster checkouts at Acme',
      done: true,
    });
    const audit = await AuditLogModel.findOne({ module: 'ColdEmailDraft' }).lean();
    expect(audit).toMatchObject({ action: 'CREATE', entityId: draft.id, entityLabel: 'Acme' });
  });

  it('pitches a contact with their company and introduces us when no goal is given', async () => {
    const acme = await seedAcme();
    const ravi = await ContactModel.create({
      name: 'Ravi',
      email: 'ravi@acme.com',
      title: 'COO',
      companyId: acme.id,
      companyName: 'Acme',
    });
    ai.mockResolvedValueOnce(email('Hello Ravi'));

    await Mutation.createColdEmailDraft(
      null,
      { input: { object: 'CONTACT', recordId: ravi.id, toEmail: 'ravi@acme.com', tone: 'BRIEF' } },
      crm(),
    );

    const prompt = promptOf(0);
    expect(prompt).toContain('Job title: COO');
    expect(prompt).toContain('Company: Acme');
    expect(prompt).toContain('an introduction to Test Co and what we do');
    expect(prompt).not.toContain('Their website:');
  });

  it('refuses an address that is not on the record, before spending anything', async () => {
    const acme = await seedAcme();

    const result = Mutation.createColdEmailDraft(
      null,
      { input: { object: 'COMPANY', recordId: acme.id, toEmail: 'x@else.com', tone: 'FRIENDLY' } },
      crm(),
    );

    expect(await codeOf(result)).toBe('BAD_USER_INPUT');
    expect(ai).not.toHaveBeenCalled();
    expect(await ColdEmailDraftModel.countDocuments()).toBe(0);
  });

  it('retries once on a malformed answer and adds up both runs', async () => {
    const acme = await seedAcme();
    ai.mockResolvedValueOnce(answer('Sure! Here is your email.', 0.02)).mockResolvedValueOnce(
      answer('```json\n{"subject":"Hi Acme","body":"Hello.\\n\\nAsha"}\n```', 0.03),
    );

    const draft = await Mutation.createColdEmailDraft(
      null,
      {
        input: {
          object: 'COMPANY',
          recordId: acme.id,
          toEmail: 'hello@acme.com',
          tone: 'FRIENDLY',
        },
      },
      crm(),
    );

    expect(ai).toHaveBeenCalledTimes(2);
    expect(draft.variants[0].subject).toBe('Hi Acme');
    expect(draft.variants[0].costUsd).toBeCloseTo(0.05);
  });

  it('fails clearly when both answers are unusable, including left-over placeholders', async () => {
    const acme = await seedAcme();
    ai.mockResolvedValueOnce(email('Hi [Name]')).mockResolvedValueOnce(answer('{"subject": ""}'));

    await expect(
      Mutation.createColdEmailDraft(
        null,
        {
          input: {
            object: 'COMPANY',
            recordId: acme.id,
            toEmail: 'hello@acme.com',
            tone: 'FRIENDLY',
          },
        },
        crm(),
      ),
    ).rejects.toThrow('The AI did not return a usable email');
    expect(await ColdEmailDraftModel.countDocuments()).toBe(0);
  });

  it('keeps the CRM desk only', async () => {
    const acme = await seedAcme();
    const result = Mutation.createColdEmailDraft(
      null,
      {
        input: {
          object: 'COMPANY',
          recordId: acme.id,
          toEmail: 'hello@acme.com',
          tone: 'FRIENDLY',
        },
      },
      ctxAs([ROLES.HR]),
    );
    expect(await codeOf(result)).toBe('FORBIDDEN');
    expect(
      await codeOf(
        Query.coldEmailDrafts(null, { input: { page: 0, pageSize: 10 } }, ctxAs([ROLES.HR])),
      ),
    ).toBe('FORBIDDEN');
  });
});

describe('versions', () => {
  it('writes another version that differs from the earlier ones, in the tone asked for', async () => {
    const { draft } = await draftFor();
    ai.mockResolvedValueOnce(email('A shorter take'));

    const saved = await Mutation.addColdEmailVariant(
      null,
      { id: draft.id, instruction: 'mention our free pilot', tone: 'BRIEF' },
      crm(),
    );

    expect(saved.variants.map((v) => v.subject)).toEqual([
      'Faster checkouts at Acme',
      'A shorter take',
    ]);
    expect(saved.variants[1]).toMatchObject({
      tone: 'BRIEF',
      instruction: 'mention our free pilot',
    });
    expect(ColdEmailDraft.variantCount(saved)).toBe(2);
    const prompt = promptOf(1);
    expect(prompt).toContain('For this version: mention our free pilot');
    expect(prompt).toContain('earlier versions: Faster checkouts at Acme');
  });

  it('stops at ten versions without calling the AI', async () => {
    const { draft } = await draftFor();
    const extra = Array.from({ length: 9 }, (_v, i) => ({
      subject: `v${i}`,
      body: 'b',
      tone: 'FRIENDLY',
    }));
    await ColdEmailDraftModel.updateOne(
      { _id: draft.id },
      { $push: { variants: { $each: extra } } },
    );
    ai.mockClear();

    expect(await codeOf(Mutation.addColdEmailVariant(null, { id: draft.id }, crm()))).toBe(
      'BAD_USER_INPUT',
    );
    expect(ai).not.toHaveBeenCalled();
  });

  it('edits and deletes unsent versions, but keeps the last one', async () => {
    const { draft } = await draftFor();
    const first = ColdEmailVariant.id(draft.variants[0] as never);

    const edited = await Mutation.updateColdEmailVariant(
      null,
      { draftId: draft.id, variantId: first, subject: ' New subject ', body: 'New body' },
      crm(),
    );
    expect(edited.variants[0]).toMatchObject({ subject: 'New subject', body: 'New body' });

    expect(
      await codeOf(
        Mutation.deleteColdEmailVariant(null, { draftId: draft.id, variantId: first }, crm()),
      ),
    ).toBe('BAD_USER_INPUT');

    ai.mockResolvedValueOnce(email('Second'));
    await Mutation.addColdEmailVariant(null, { id: draft.id }, crm());
    const left = await Mutation.deleteColdEmailVariant(
      null,
      { draftId: draft.id, variantId: first },
      crm(),
    );
    expect(left.variants.map((v) => v.subject)).toEqual(['Second']);
  });
});

describe('sending a version', () => {
  const sentMessage = {
    gmailId: 'g-1',
    subject: 'Edited',
    mailbox: 'sales@exyconn.com',
    to: ['hello@acme.com'],
  };

  it('sends the edited text to the draft’s address, links the message and marks it sent once', async () => {
    const { draft } = await draftFor();
    const variantId = ColdEmailVariant.id(draft.variants[0] as never);
    send.mockResolvedValue({ provider: 'GMAIL', sent: sentMessage } as never);
    const input = {
      draftId: draft.id,
      variantId,
      fromAccountId: 'acc-1',
      subject: 'Edited',
      body: 'Edited body',
    };

    const saved = await Mutation.sendColdEmailVariant(null, { input }, crm());

    expect(send).toHaveBeenCalledWith(
      { fromAccountId: 'acc-1', to: ['hello@acme.com'], subject: 'Edited', body: 'Edited body' },
      'asha@exyconn.com',
    );
    expect(saved.status).toBe('SENT');
    expect(saved.variants[0]).toMatchObject({
      subject: 'Edited',
      body: 'Edited body',
      sentMessageId: 'g-1',
    });
    expect(saved.variants[0].sentAt).toBeInstanceOf(Date);

    expect(await codeOf(Mutation.sendColdEmailVariant(null, { input }, crm()))).toBe(
      'BAD_USER_INPUT',
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(
      await codeOf(
        Mutation.updateColdEmailVariant(
          null,
          { draftId: draft.id, variantId, subject: 's', body: 'b' },
          crm(),
        ),
      ),
    ).toBe('BAD_USER_INPUT');
  });

  it('releases the version when the mailbox refuses, so it can be sent again', async () => {
    const { draft } = await draftFor();
    const variantId = ColdEmailVariant.id(draft.variants[0] as never);
    send.mockRejectedValueOnce(new Error('Gmail said no'));
    const input = { draftId: draft.id, variantId, fromAccountId: 'acc-1', subject: 'S', body: 'B' };

    await expect(Mutation.sendColdEmailVariant(null, { input }, crm())).rejects.toThrow(
      'Gmail said no',
    );

    const stored = await ColdEmailDraftModel.findById(draft.id).lean();
    expect(stored?.variants[0].sentAt).toBeNull();
    expect(stored?.status).toBe('DRAFT');
  });
});

describe('the cold emails list', () => {
  it('pages drafts, filters by record, reads one, and deletes it with an audit entry', async () => {
    const { acme, draft } = await draftFor();
    const ctx = crm();

    const page = await Query.coldEmailDrafts(
      null,
      {
        input: {
          page: 0,
          pageSize: 5,
          filters: [{ field: 'recordId', op: 'EQUALS', value: acme.id }],
        },
      },
      ctx,
    );
    expect(page.totalCount).toBe(1);
    expect(page.rows.map((row) => row.id)).toEqual([draft.id]);
    expect(await Query.coldEmailDraft(null, { id: draft.id }, ctx)).toMatchObject({ id: draft.id });

    expect(await Mutation.deleteColdEmailDraft(null, { id: draft.id }, ctx)).toBe(true);
    expect(await ColdEmailDraftModel.countDocuments()).toBe(0);
    expect(await AuditLogModel.countDocuments({ module: 'ColdEmailDraft', action: 'DELETE' })).toBe(
      1,
    );
    expect(await codeOf(Query.coldEmailDraft(null, { id: draft.id }, ctx))).toBe('NOT_FOUND');
  });

  it('archives drafts in bulk', async () => {
    const { draft } = await draftFor();
    const target = registeredBulkTarget('coldEmailDrafts');
    expect(target?.entity).toBe('ColdEmailDraft');

    expect(await target?.archive?.(crm(), [draft.id], true)).toBe(1);

    const page = await Query.coldEmailDrafts(null, { input: { page: 0, pageSize: 5 } }, crm());
    expect(page.totalCount).toBe(0);
  });
});
