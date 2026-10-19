import { LeadModel } from '../../../../../src/modules/crm/crm.model';
import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { CrmPropertyModel } from '../../../../../src/modules/crm/records/crm-property.model';
import {
  importRecords,
  MAX_IMPORT_ROWS,
  type ImportInput,
} from '../../../../../src/modules/crm/records/crm.import';
import { logger } from '../../../../../src/utils/logger';

const run = (overrides: Partial<ImportInput>) =>
  importRecords(
    { object: 'LEAD', mode: 'CREATE', rows: [], firstRowNumber: 2, ...overrides },
    'Asha',
  );

afterEach(() => {
  jest.restoreAllMocks();
});

describe('importing leads', () => {
  it('creates new leads with the importer as owner and a value of 0', async () => {
    const result = await run({
      rows: [
        { name: 'Ravi', email: 'Ravi@Acme.com', stage: 'qualified' },
        { name: 'Meera', email: 'meera@acme.com', value: '₹5,000', owner: 'Kiran', notes: '' },
      ],
    });

    expect(result).toEqual({ created: 2, updated: 0, skipped: 0, issues: [] });
    const leads = await LeadModel.find().sort({ name: 1 }).lean();
    expect(leads.map((l) => [l.name, l.email, l.stage, l.value, l.owner])).toEqual([
      ['Meera', 'meera@acme.com', 'NEW', 5000, 'Kiran'],
      ['Ravi', 'ravi@acme.com', 'QUALIFIED', 0, 'Asha'],
    ]);
  });

  it('writes custom properties under custom', async () => {
    await CrmPropertyModel.create([
      { object: 'LEAD', key: 'score', label: 'Score', type: 'NUMBER' },
      { object: 'LEAD', key: 'region', label: 'Region', type: 'TEXT' },
    ]);

    await run({ rows: [{ name: 'Ravi', email: 'ravi@acme.com', score: '7', region: 'APAC' }] });

    expect((await LeadModel.findOne().lean())?.custom).toEqual({ score: 7, region: 'APAC' });
  });

  it.each([0, MAX_IMPORT_ROWS + 1])('refuses a chunk of %p rows', async (count) => {
    const rows = Array.from({ length: count }, (_, i) => ({ name: 'N', email: `n${i}@a.com` }));
    await expect(run({ rows })).rejects.toThrow('Send between 1 and 500 rows at a time');
  });

  it('refuses the whole chunk when a column is not an importable property', async () => {
    await expect(
      run({ rows: [{ name: 'A', email: 'a@a.com', campaignName: 'X' }] }),
    ).rejects.toThrow('"campaignName" is not a property that can be imported');
    expect(await LeadModel.countDocuments()).toBe(0);
  });

  it('reports bad rows by file line and still imports the good ones, in line order', async () => {
    const result = await run({
      firstRowNumber: 10,
      rows: [
        { name: 'Bad', email: 'not-an-email', value: 'lots' },
        null,
        ['a', 'b'],
        'text',
        { name: 'No email' },
        { email: 'noname@acme.com' },
        { name: 'Good', email: 'good@acme.com' },
        { name: 'Again', email: 'GOOD@acme.com' },
      ],
    });

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.issues).toEqual([
      {
        row: 10,
        message: 'Email "not-an-email" is not an email address; Value "lots" is not a number',
        skipped: false,
      },
      { row: 11, message: 'The row could not be read', skipped: false },
      { row: 12, message: 'The row could not be read', skipped: false },
      { row: 13, message: 'The row could not be read', skipped: false },
      { row: 14, message: 'Email is required', skipped: false },
      { row: 15, message: 'Missing Name', skipped: false },
      { row: 17, message: 'Same email as row 16', skipped: true },
    ]);
  });
});

describe('import modes against existing records', () => {
  beforeEach(async () => {
    const base = {
      email: 'ravi@acme.com',
      source: 'WEBSITE',
      stage: 'NEW',
      owner: 'Kiran',
      custom: {},
    };
    await LeadModel.collection.insertMany([
      { ...base, name: 'Later twin', value: 2, notes: '', createdAt: new Date('2026-02-01') },
      { ...base, name: 'Old Ravi', value: 1, notes: 'keep me', createdAt: new Date('2026-01-01') },
    ]);
  });
  const rows = [
    { name: 'Ravi', email: 'ravi@acme.com', notes: '' },
    { name: 'Meera', email: 'meera@acme.com' },
  ];

  it('CREATE skips a record that already exists', async () => {
    const result = await run({ mode: 'CREATE', rows });

    expect(result).toMatchObject({ created: 1, updated: 0, skipped: 1 });
    expect(result.issues).toEqual([
      { row: 2, message: 'A record with email ravi@acme.com already exists', skipped: true },
    ]);
  });

  it('UPDATE changes the oldest match, keeps blank cells, and skips unknown records', async () => {
    const result = await run({ mode: 'UPDATE', rows });

    expect(result).toMatchObject({ created: 0, updated: 1, skipped: 1 });
    expect(result.issues[0].message).toBe('No record with email meera@acme.com to update');
    const leads = await LeadModel.find().sort({ createdAt: 1 }).lean();
    expect(leads.map((l) => [l.name, l.notes])).toEqual([
      ['Ravi', 'keep me'],
      ['Later twin', ''],
    ]);
  });

  it('UPSERT updates what exists and creates the rest', async () => {
    expect(await run({ mode: 'UPSERT', rows })).toEqual({
      created: 1,
      updated: 1,
      skipped: 0,
      issues: [],
    });
  });
});

describe('rows the database refuses', () => {
  it('names a validation failure and logs it', async () => {
    const warn = jest.spyOn(logger, 'warn').mockReturnValue(undefined);

    const result = await run({ rows: [{ name: 'Neg', email: 'neg@acme.com', value: '-5' }] });

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].message).toMatch(/value/i);
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ row: 2, err: expect.any(String) }),
      'CRM import row failed',
    );
  });

  it('says another row made the record when the unique index refuses it', async () => {
    jest
      .spyOn(CompanyModel, 'create')
      .mockRejectedValueOnce(Object.assign(new Error('E11000'), { code: 11000 }));

    const result = await run({ object: 'COMPANY', rows: [{ name: 'Acme', domain: 'acme.com' }] });

    expect(result.issues).toEqual([
      { row: 2, message: 'Another row created this record a moment ago', skipped: false },
    ]);
  });

  it('falls back to a plain message when the failure says nothing', async () => {
    const warn = jest.spyOn(logger, 'warn').mockReturnValue(undefined);
    jest
      .spyOn(CompanyModel, 'create')
      .mockRejectedValueOnce(new Error(''))
      .mockRejectedValueOnce({ code: 1 });

    const result = await run({
      object: 'COMPANY',
      rows: [
        { name: 'Acme', domain: 'acme.com' },
        { name: 'Beta', domain: 'beta.io' },
      ],
    });

    expect(result.issues.map((i) => i.message)).toEqual([
      'The row could not be saved',
      'The row could not be saved',
    ]);
    expect(warn).toHaveBeenLastCalledWith({ err: { code: 1 }, row: 3 }, 'CRM import row failed');
  });
});

describe('importing companies and contacts', () => {
  it('reads a company website as its bare domain and dedupes on it', async () => {
    const result = await run({
      object: 'COMPANY',
      rows: [
        { name: 'Acme', domain: 'https://www.acme.com/about' },
        { name: 'Acme again', domain: 'ACME.com' },
      ],
    });

    expect(result).toMatchObject({ created: 1, skipped: 1 });
    const company = await CompanyModel.findOne().lean();
    expect(company).toMatchObject({ domain: 'acme.com', owner: 'Asha' });
    expect(company).not.toHaveProperty('value');
  });

  it('links a contact to the company of the name it gives, whatever its case', async () => {
    const acme = await CompanyModel.create({ name: 'Acme Ltd', domain: 'acme.com', owner: 'A' });

    await run({
      object: 'CONTACT',
      rows: [
        { name: 'Ravi', email: 'ravi@acme.com', companyName: 'acme LTD' },
        { name: 'Meera', email: 'meera@beta.io', companyName: 'Beta' },
        { name: 'Solo', email: 'solo@x.io' },
      ],
    });

    const contacts = await ContactModel.find().sort({ name: 1 }).lean();
    expect(contacts.map((c) => [c.name, c.companyName, c.companyId])).toEqual([
      ['Meera', 'Beta', ''],
      ['Ravi', 'Acme Ltd', acme._id.toHexString()],
      ['Solo', '', ''],
    ]);
  });

  it('skips the company lookup when no contact names a company', async () => {
    const find = jest.spyOn(CompanyModel, 'find');

    const result = await run({ object: 'CONTACT', rows: [{ name: 'Solo', email: 'solo@x.io' }] });

    expect(result.created).toBe(1);
    expect(find).not.toHaveBeenCalled();
  });
});
