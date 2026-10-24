import {
  MAX_FACT_CHARS,
  companyFacts,
  contactFacts,
} from '../../../../../src/modules/crm/cold-email/cold-email.facts';
import { recordFacts } from '../../../../../src/modules/crm/cold-email/cold-email.context';
import { coldEmailPrompt } from '../../../../../src/modules/crm/cold-email/cold-email.prompt';
import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { DealModel } from '../../../../../src/modules/crm/deal.model';
import { CrmPropertyModel } from '../../../../../src/modules/crm/records/crm-property.model';
import { useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';

useTestOrganization();

const seedAcme = (fields: Record<string, unknown> = {}) =>
  CompanyModel.create({
    name: 'Acme',
    domain: 'acme.com',
    industry: 'Retail',
    status: 'PROSPECT',
    employeeCount: 120,
    city: 'Pune',
    country: 'India',
    timezone: 'Asia/Kolkata',
    description: 'Chain of grocery stores.',
    notes: 'Met at the retail summit.',
    origin: { source: 'WEBSITE', userId: '', userName: '', userEmail: '' },
    tags: ['grocery', 'west'],
    emails: [{ address: 'hello@acme.com', primary: true }],
    ...fields,
  });

const person = (companyId: string, name: string, fields: Record<string, unknown> = {}) =>
  ContactModel.create({ name, email: `${name.toLowerCase()}@acme.com`, companyId, ...fields });

const deal = (title: string, fields: Record<string, unknown>) =>
  DealModel.create({ title, owner: 'Asha', stage: 'DISCOVERY', ...fields });

describe('companyFacts', () => {
  it('reads the profile, origin, tags, notes, deals and people at the company', async () => {
    const acme = await seedAcme();
    const id = acme._id.toHexString();
    await person(id, 'Ravi', { title: 'Head of IT' });
    await person(id, 'Meera');
    await person(id, 'Gone', { title: 'CFO', status: 'LEFT_COMPANY' });
    await deal('POS rollout', { companyId: id });

    const facts = await companyFacts(id, true);

    expect(facts?.name).toBe('Acme');
    expect(facts?.website).toBe('acme.com');
    expect(facts?.lines).toEqual(
      expect.arrayContaining([
        'Company: Acme',
        'Industry: Retail',
        'Website: acme.com',
        'Where they stand with us: PROSPECT',
        'Employees: 120',
        'Location: Pune, India',
        'Time zone: Asia/Kolkata',
        'How they came to us: From website',
        'Tags: grocery, west',
        'About the company: Chain of grocery stores.',
        'Our notes on the company: Met at the retail summit.',
        'Deal with us: POS rollout (stage DISCOVERY)',
        'Person there: Ravi, Head of IT',
        'Person there: Meera',
      ]),
    );
    // Somebody who left is not pitched, and contact points never reach the model.
    expect(facts?.lines.join('\n')).not.toMatch(/Gone|hello@acme\.com|@acme\.com/);
  });

  it('leaves out unknown values, deals and people when not asked for them', async () => {
    const acme = await seedAcme({ industry: '', employeeCount: null, tags: [], notes: '' });
    const id = acme._id.toHexString();
    await person(id, 'Ravi');
    await deal('POS rollout', { companyId: id });

    const facts = await companyFacts(id, false);

    expect(facts?.lines.some((line) => /^(Industry|Employees|Tags|Our notes)/.test(line))).toBe(
      false,
    );
    expect(facts?.lines.some((line) => /^(Deal with us|Person there)/.test(line))).toBe(false);
  });

  it('prefers the website over the domain, and the place over the free-text location', async () => {
    const acme = await seedAcme({ website: 'https://www.acme.com', location: 'Somewhere' });
    const facts = await companyFacts(acme._id.toHexString(), false);
    expect(facts?.website).toBe('https://www.acme.com');
    expect(facts?.lines).toContain('Location: Pune, India');

    const noPlace = await seedAcme({ domain: 'b.com', city: '', country: '', location: 'Goa' });
    const other = await companyFacts(noPlace._id.toHexString(), false);
    expect(other?.lines).toContain('Location: Goa');
  });

  it('cuts a long free-text field to the cap', async () => {
    const acme = await seedAcme({ description: 'x'.repeat(MAX_FACT_CHARS + 500) });
    const facts = await companyFacts(acme._id.toHexString(), false);
    const about = facts?.lines.find((line) => line.startsWith('About the company: '));
    expect(about).toBe(`About the company: ${'x'.repeat(MAX_FACT_CHARS)}`);
  });

  it('reads custom properties by label, skipping contact points and uploads', async () => {
    await CrmPropertyModel.create([
      {
        object: 'COMPANY',
        key: 'tier',
        label: 'Tier',
        type: 'ENUM',
        options: [{ value: 'GOLD', label: 'Gold' }],
      },
      {
        object: 'COMPANY',
        key: 'markets',
        label: 'Markets',
        type: 'MULTI_SELECT',
        options: [
          { value: 'IN', label: 'India' },
          { value: 'AE', label: 'UAE' },
        ],
      },
      { object: 'COMPANY', key: 'renewal', label: 'Renewal', type: 'DATE' },
      { object: 'COMPANY', key: 'partner', label: 'Partner', type: 'BOOLEAN' },
      { object: 'COMPANY', key: 'unset', label: 'Unset', type: 'TEXT' },
      { object: 'COMPANY', key: 'cfoMail', label: 'CFO mail', type: 'EMAIL' },
      { object: 'COMPANY', key: 'desk', label: 'Desk phone', type: 'PHONE' },
      { object: 'COMPANY', key: 'deck', label: 'Deck', type: 'FILE' },
    ]);
    const acme = await seedAcme({
      custom: {
        tier: 'GOLD',
        markets: ['IN', 'AE'],
        renewal: new Date('2026-03-31T00:00:00Z'),
        partner: false,
        cfoMail: 'cfo@acme.com',
        desk: '+91 20 1234 5678',
        deck: 'https://files/deck.pdf',
      },
    });

    const facts = await companyFacts(acme._id.toHexString(), false);

    expect(facts?.lines).toEqual(
      expect.arrayContaining([
        'Tier: Gold',
        'Markets: India, UAE',
        'Renewal: 2026-03-31',
        'Partner: No',
      ]),
    );
    expect(facts?.lines.join('\n')).not.toMatch(/Unset|CFO mail|Desk phone|Deck|cfo@acme/);
  });

  it('answers null for a company that is gone', async () => {
    await expect(companyFacts('64b000000000000000000000', true)).resolves.toBeNull();
  });
});

describe('contactFacts', () => {
  it('reads the person, their deals and their company without its people', async () => {
    const acme = await seedAcme();
    const companyId = acme._id.toHexString();
    await person(companyId, 'Meera', { title: 'COO' });
    const ravi = await person(companyId, 'Ravi', {
      title: 'Head of IT',
      department: 'Technology',
      companyName: 'Acme',
      lifecycleStage: 'LEAD',
      languages: ['English', 'Marathi'],
      notes: 'Prefers email.',
    });
    const raviId = ravi._id.toHexString();
    await deal('Support plan', { contactId: raviId });

    const facts = await contactFacts(raviId);

    expect(facts?.name).toBe('Ravi');
    expect(facts?.website).toBe('acme.com');
    expect(facts?.lines).toEqual(
      expect.arrayContaining([
        'Person: Ravi',
        'Job title: Head of IT',
        'Department: Technology',
        'Works at: Acme',
        'Languages: English, Marathi',
        'Our notes on the person: Prefers email.',
        'Deal with us: Support plan (stage DISCOVERY)',
        'Company: Acme',
      ]),
    );
    expect(facts?.lines.some((line) => line.startsWith('Person there:'))).toBe(false);
    expect(facts?.lines.join('\n')).not.toContain('ravi@acme.com');
  });

  it('uses the person’s own website, and none without a company', async () => {
    const solo = await ContactModel.create({
      name: 'Solo',
      email: 'solo@example.com',
      website: 'https://solo.dev',
    });
    await expect(contactFacts(solo._id.toHexString())).resolves.toMatchObject({
      website: 'https://solo.dev',
    });

    const bare = await ContactModel.create({ name: 'Bare', email: 'bare@example.com' });
    await expect(contactFacts(bare._id.toHexString())).resolves.toMatchObject({ website: '' });
  });

  it('answers null for a contact that is gone', async () => {
    await expect(contactFacts('64b000000000000000000000')).resolves.toBeNull();
  });
});

describe('recordFacts', () => {
  it('reads a company with its people and refuses a missing record as not found', async () => {
    const acme = await seedAcme();
    await person(acme._id.toHexString(), 'Ravi');

    const facts = await recordFacts('COMPANY', acme._id.toHexString());

    expect(facts.lines).toContain('Person there: Ravi');
    await expect(codeOf(recordFacts('CONTACT', '64b000000000000000000000'))).resolves.toBe(
      'NOT_FOUND',
    );
  });
});

describe('the cold email prompt', () => {
  it('tells the model to speak to the role and never to quote internal records', () => {
    const prompt = coldEmailPrompt({
      offering: '',
      senderName: 'Asha',
      organizationName: 'Exyconn',
      recipientName: 'Ravi',
      context: 'Company: Acme',
      goal: 'our checkout software',
      tone: 'FRIENDLY',
      instruction: '',
      earlierSubjects: [],
    });

    expect(prompt).toContain("- Speak to the person's role and the company's industry");
    expect(prompt).toContain(
      '- Our internal notes, tags, deal stages and lead details are background only: never quote them or say we keep records on them.',
    );
  });
});
