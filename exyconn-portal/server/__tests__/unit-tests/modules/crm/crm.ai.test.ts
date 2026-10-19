import { aiDraft, runAssist } from '../../../../src/modules/ai/ai.actions';
import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { draftCrmEmail, summariseCrmRecord } from '../../../../src/modules/crm/crm.ai';
import { CrmEmailMessageModel } from '../../../../src/modules/gmail/gmail.models';

// The model call is external; what the CRM hands it is what these tests read.
jest.mock('../../../../src/modules/ai/ai.actions', () => ({
  aiDraft: jest.fn().mockResolvedValue('draft'),
  runAssist: jest.fn().mockResolvedValue('summary'),
}));

const actor = { id: 'u1', name: 'Asha' };
const MISSING_ID = '64b7f0c2a1b2c3d4e5f60718';
const draftContext = () => jest.mocked(aiDraft).mock.calls[0][1];
const summaryPrompt = () => jest.mocked(runAssist).mock.calls[0][1];

const message = (n: number, fields: Record<string, unknown> = {}) => ({
  gmailId: `g${n}`,
  threadId: 't1',
  direction: 'IN',
  from: `person${n}@acme.com`,
  snippet: `snippet ${n}`,
  bodyText: `body ${n}`,
  sentAt: new Date(Date.UTC(2026, 0, n)),
  ...fields,
});

describe('drafting a CRM email', () => {
  it('describes the contact and reads the last six messages of the thread, oldest first', async () => {
    const asha = await ContactModel.create({
      name: 'Asha',
      email: 'asha@acme.com',
      owner: 'A',
      title: 'CTO',
      companyName: 'Acme',
      description: 'Met at the expo.',
    });
    await CrmEmailMessageModel.create(
      Array.from({ length: 8 }, (_v, i) => message(i + 1)).concat(
        message(9, { gmailId: 'g9', bodyText: '', snippet: 'only a snippet' }),
      ),
    );
    await CrmEmailMessageModel.create(message(10, { gmailId: 'long', bodyText: 'x'.repeat(2000) }));

    await expect(
      draftCrmEmail(
        { object: 'CONTACT', id: asha.id, threadId: 't1', instruction: ' share pricing ' },
        actor,
      ),
    ).resolves.toBe('draft');

    expect(jest.mocked(aiDraft).mock.calls[0][0]).toBe('EMAIL_REPLY');
    const context = draftContext();
    expect(context).toContain('Contact: Asha (CTO at Acme). Met at the expo.');
    expect(context).not.toContain('body 4');
    expect(context.indexOf('body 5')).toBeLessThan(context.indexOf('only a snippet'));
    expect(context).toContain(`${'x'.repeat(1500)}\n`);
    expect(context).not.toContain('x'.repeat(1501));
    expect(context).toContain('What to say: share pricing');
  });

  it('writes a new email with a friendly default when nothing is asked', async () => {
    const asha = await ContactModel.create({ name: 'Asha', email: 'asha@acme.com', owner: 'A' });

    await draftCrmEmail({ object: 'CONTACT', id: asha.id, instruction: '  ' }, actor);

    const context = draftContext();
    expect(context).toContain('Contact: Asha . ');
    expect(context).toContain('This is a new email.');
    expect(context).toContain('What to say: a helpful, friendly follow-up');
  });

  it('describes a company by its industry, and drafts with no description for a missing record', async () => {
    const acme = await CompanyModel.create({
      name: 'Acme',
      domain: 'acme.com',
      owner: 'A',
      industry: 'Retail',
      description: 'Chain of stores.',
    });
    await draftCrmEmail({ object: 'COMPANY', id: acme.id, instruction: 'hi' }, actor);
    expect(draftContext()).toContain('Company: Acme (Retail). Chain of stores.');

    for (const object of ['CONTACT', 'COMPANY'] as const) {
      jest.mocked(aiDraft).mockClear();
      await draftCrmEmail({ object, id: MISSING_ID, instruction: 'hi' }, actor);
      expect(draftContext().startsWith('\n\nThis is a new email.')).toBe(true);
    }
  });

  it('describes a company without an industry or a description', async () => {
    const { insertedId } = await CompanyModel.collection.insertOne({
      name: 'Bare',
      domain: 'bare.co',
    });

    await draftCrmEmail(
      { object: 'COMPANY', id: insertedId.toHexString(), instruction: 'hi' },
      actor,
    );

    expect(draftContext()).toContain('Company: Bare . ');
  });

  it('describes a contact without a description', async () => {
    const { insertedId } = await ContactModel.collection.insertOne({
      name: 'Ravi',
      email: 'r@x.co',
    });

    await draftCrmEmail(
      { object: 'CONTACT', id: insertedId.toHexString(), instruction: 'hi' },
      actor,
    );

    expect(draftContext()).toContain('Contact: Ravi . \n');
  });
});

describe('summarising a CRM record', () => {
  it('says nothing has happened yet without calling the model', async () => {
    await expect(summariseCrmRecord('COMPANY', MISSING_ID, actor)).rejects.toThrow(
      'Company not found',
    );
    const acme = await CompanyModel.create({ name: 'Acme', domain: 'acme.com', owner: 'A' });

    await expect(summariseCrmRecord('COMPANY', acme.id, actor)).resolves.toBe(
      'Nothing has happened with this record yet.',
    );
    expect(runAssist).not.toHaveBeenCalled();
  });

  it('hands the model the history, newest first, with each summary shortened', async () => {
    const acme = await CompanyModel.create({ name: 'Acme', domain: 'acme.com', owner: 'A' });
    await ActivityModel.collection.insertOne({
      type: 'NOTE',
      subject: 'Asked for pricing',
      notes: 'p'.repeat(400),
      relatedType: 'COMPANY',
      relatedId: acme.id,
      owner: 'Asha',
      createdAt: new Date('2026-03-01T10:00:00Z'),
    });
    await ActivityModel.collection.insertOne({
      type: 'CALL',
      subject: 'Intro call',
      notes: '',
      relatedType: 'COMPANY',
      relatedId: acme.id,
      owner: 'Asha',
      createdAt: new Date('2026-02-01T10:00:00Z'),
    });

    await expect(summariseCrmRecord('COMPANY', acme.id, actor)).resolves.toBe('summary');

    expect(jest.mocked(runAssist).mock.calls[0][0]).toBe('CRM record summary');
    const prompt = summaryPrompt();
    expect(prompt).toContain('Company: Acme . ');
    expect(prompt).toContain(
      `2026-03-01 NOTE: Asked for pricing — ${'p'.repeat(300)}\n2026-02-01 CALL: Intro call`,
    );
    expect(prompt).not.toContain('p'.repeat(301));
    expect(prompt.endsWith('2026-02-01 CALL: Intro call')).toBe(true);
  });
});
