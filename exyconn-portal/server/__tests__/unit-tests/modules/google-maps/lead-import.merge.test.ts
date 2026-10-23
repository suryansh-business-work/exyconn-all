import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import {
  importLeads,
  previewLeads,
  type LeadImportInput,
} from '../../../../src/modules/google-maps/lead-import.service';
import * as leadMerge from '../../../../src/modules/google-maps/lead-merge.service';

// Every website here answers 200 OK; website-check.test.ts covers the ones that do not.
jest.mock('../../../../src/modules/google-maps/website-check', () => ({
  checkWebsites: jest.fn(
    async (sites: string[]) =>
      new Map(sites.map((site) => [site, { ok: true, reason: '', logoUrl: '' }])),
  ),
}));

const ORIGIN = {
  source: 'GOOGLE_PLACES' as const,
  userId: 'u1',
  userName: '',
  userEmail: 'a@x.test',
};

const lead = (over: Partial<LeadImportInput> = {}): LeadImportInput => ({
  placeId: 'place-1',
  name: 'Smile Dental',
  lat: 18.52,
  lng: 73.85,
  ...over,
});

const create = (fields: Record<string, unknown>) =>
  CompanyModel.create({ owner: '', ...fields }).then((row) => row._id.toHexString());

afterEach(() => {
  jest.restoreAllMocks();
});

describe('previewLeads', () => {
  it('says which leads are new, plain duplicates, or duplicates with something to add', async () => {
    const filedId = await create({
      name: 'Filed',
      domain: 'filed.example',
      placeId: 'place-1',
      lat: 1,
      lng: 2,
    });
    const extraId = await create({ name: 'Acme', domain: 'acme.example' });

    const preview = await previewLeads([
      lead(),
      lead({ placeId: 'place-2', name: 'Acme', website: 'https://acme.example' }),
      lead({ placeId: 'place-3', name: 'Brand new' }),
    ]);

    expect(preview).toEqual([
      {
        placeId: 'place-1',
        name: 'Smile Dental',
        status: 'DUPLICATE',
        existingCompanyId: filedId,
        existingName: 'Filed',
        extras: [],
      },
      expect.objectContaining({
        placeId: 'place-2',
        status: 'DUPLICATE_WITH_EXTRA',
        existingCompanyId: extraId,
        existingName: 'Acme',
      }),
      {
        placeId: 'place-3',
        name: 'Brand new',
        status: 'NEW',
        existingCompanyId: null,
        existingName: null,
        extras: [],
      },
    ]);
    expect(preview[1].extras.map((extra) => extra.field)).toContain('website');
  });
});

describe('importLeads with duplicates', () => {
  it('says which rule a skipped duplicate matched', async () => {
    const phoneId = await create({
      name: 'Phoned',
      domain: 'phoned.example',
      phone: '020 5555 0000',
    });
    const nameId = await create({ name: 'Bright Dental', domain: 'bright.example', city: 'Pune' });

    const result = await importLeads(
      [
        lead({ placeId: 'p1', name: 'Other', phone: '+91 20 5555 0000' }),
        lead({ placeId: 'p2', name: 'bright dental', city: 'pune' }),
      ],
      ORIGIN,
    );

    expect(result.skips).toEqual([
      {
        placeId: 'p1',
        name: 'Other',
        reason: 'A company with the phone number +91 20 5555 0000 already exists',
        companyId: phoneId,
      },
      {
        placeId: 'p2',
        name: 'bright dental',
        reason: 'A company named Bright Dental in pune already exists',
        companyId: nameId,
      },
    ]);
  });

  it('merges a duplicate the user agreed to, and lets later leads match what it added', async () => {
    const id = await create({ name: 'Acme', domain: 'acme.example' });

    const result = await importLeads(
      [
        lead({
          placeId: 'place-a',
          name: 'Acme',
          website: 'https://acme.example',
          address: 'A St',
        }),
        lead({ placeId: 'place-a', name: 'Acme again' }),
      ],
      ORIGIN,
      [{ placeId: ' place-a ', companyId: id }],
    );

    expect(result).toMatchObject({ created: 0, merged: 1, skipped: 1 });
    expect(result.merges).toEqual([
      expect.objectContaining({ placeId: 'place-a', companyId: id, name: 'Acme' }),
    ]);
    expect(result.merges[0].added.map((extra) => extra.field)).toEqual(
      expect.arrayContaining(['address', 'placeId']),
    );
    // The second lead now matches by the Place ID the merge just filed, with nothing new to add.
    expect(result.skips).toEqual([
      expect.objectContaining({
        placeId: 'place-a',
        reason: 'Already in the CRM, with nothing new to add',
        companyId: id,
      }),
    ]);
    await expect(CompanyModel.findById(id).lean()).resolves.toMatchObject({
      address: 'A St',
      placeId: 'place-a',
    });
  });

  it('skips a merge the review aimed at another company, or at an id that is not one', async () => {
    const id = await create({ name: 'Acme', domain: 'acme.example' });
    const otherId = await create({ name: 'Other', domain: 'other.example' });

    const result = await importLeads(
      [
        lead({ placeId: 'p1', website: 'https://acme.example' }),
        lead({ placeId: 'p2', name: 'Acme two', website: 'https://acme.example' }),
      ],
      ORIGIN,
      [
        { placeId: 'p1', companyId: otherId },
        { placeId: 'p2', companyId: 'not-an-id' },
      ],
    );

    expect(result.skips.map((skip) => [skip.reason, skip.companyId])).toEqual([
      ['The CRM changed since the review. Run Add to CRM again.', id],
      ['A company with the domain acme.example already exists', id],
    ]);
  });

  it('skips with the reason when the merge found the company gone or busy', async () => {
    const id = await create({ name: 'Acme', domain: 'acme.example' });
    jest
      .spyOn(leadMerge, 'mergeLead')
      .mockResolvedValueOnce({ outcome: 'GONE' })
      .mockResolvedValueOnce({ outcome: 'BUSY' });
    const mergeInto = [
      { placeId: 'p1', companyId: id },
      { placeId: 'p2', companyId: id },
    ];

    const result = await importLeads(
      [
        lead({ placeId: 'p1', website: 'https://acme.example' }),
        lead({ placeId: 'p2', name: 'Two', website: 'https://acme.example' }),
      ],
      ORIGIN,
      mergeInto,
    );

    expect(result.skips.map((skip) => skip.reason)).toEqual([
      'The company was deleted during the import. Run Add to CRM again.',
      'The company was being edited at the same time. Run Add to CRM again.',
    ]);
  });
});

describe('importLeads filing new companies', () => {
  it('names the importer by name on the timeline note, with the address and map link', async () => {
    const result = await importLeads(
      [lead({ address: '12 MG Road', mapUrl: 'https://maps.google.com/?cid=1' })],
      { ...ORIGIN, userName: 'Asha' },
    );

    const note = await ActivityModel.findOne({ relatedId: result.filed[0].companyId }).lean();
    expect(note).toMatchObject({
      owner: 'Asha',
      notes: '12 MG Road\nhttps://maps.google.com/?cid=1',
      subject: 'Added from Google Places',
    });
  });

  it('skips a lead another import filed at the same moment', async () => {
    const duplicate = Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
    jest.spyOn(CompanyModel, 'create').mockRejectedValueOnce(duplicate);

    const result = await importLeads([lead()], ORIGIN);

    expect(result).toMatchObject({ created: 0, skipped: 1 });
    expect(result.skips[0]).toMatchObject({ reason: 'Already in the CRM', companyId: null });
  });

  it('lets any other failure through', async () => {
    jest.spyOn(CompanyModel, 'create').mockRejectedValueOnce(new Error('disk full'));

    await expect(importLeads([lead()], ORIGIN)).rejects.toThrow('disk full');
  });
});
