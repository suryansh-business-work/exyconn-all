import {
  domainOf,
  importLeads,
  LEAD_SOURCE,
  MAX_IMPORT,
  type LeadImportInput,
} from '../../../../src/modules/google-maps/lead-import.service';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ActivityModel } from '../../../../src/modules/crm/activity.model';
import {
  checkWebsites,
  type WebsiteCheck,
} from '../../../../src/modules/google-maps/website-check';

jest.mock('../../../../src/modules/google-maps/website-check', () => ({
  checkWebsites: jest.fn(),
}));

const LOGO = 'https://www.google.com/s2/favicons?domain=smiledental.example&sz=64';
/** What each website answers in a test; anything not listed answers 200 OK with a favicon. */
let answers: Record<string, WebsiteCheck> = {};
const checkWebsitesMock = checkWebsites as jest.MockedFunction<typeof checkWebsites>;

beforeEach(() => {
  answers = {};
  checkWebsitesMock.mockImplementation(
    async (sites) =>
      new Map(
        sites.map((site) => [site, answers[site] ?? { ok: true, reason: '', logoUrl: LOGO }]),
      ),
  );
});

/** The person running the import, as the import records them. */
const ASHA = { source: 'GOOGLE_PLACES' as const, userId: 'u1', userName: 'Asha', userEmail: '' };

const lead = (over: Partial<LeadImportInput> = {}): LeadImportInput => ({
  placeId: 'place-1',
  name: 'Smile Dental',
  phone: '+91 20 1234 5678',
  website: 'https://www.smiledental.example/home',
  address: '12 MG Road, Pune',
  city: 'Pune',
  country: 'in',
  lat: 18.52,
  lng: 73.85,
  mapUrl: 'https://maps.google.com/?cid=1',
  emails: ['Hello@SmileDental.example', 'not-an-email'],
  primaryType: 'Dentist',
  ...over,
});

describe('domainOf', () => {
  it('reads the host without www, and nothing from a non-web URL', () => {
    expect(domainOf('https://www.Acme.example/x')).toBe('acme.example');
    expect(domainOf('javascript:alert(1)')).toBe('');
    expect(domainOf('')).toBe('');
  });
});

describe('importLeads', () => {
  it('files a company with its contact points, map and source, and notes it on the timeline', async () => {
    const result = await importLeads([lead()], ASHA);

    expect(result).toMatchObject({ created: 1, skipped: 0, skips: [] });
    const company = await CompanyModel.findById(result.filed[0].companyId).lean();
    expect(company).toMatchObject({
      name: 'Smile Dental',
      domain: 'smiledental.example',
      owner: '',
      leadOwner: 'Asha',
      status: 'PROSPECT',
      phone: '+91 20 1234 5678',
      country: 'IN',
      lat: 18.52,
      lng: 73.85,
      placeId: 'place-1',
      mapUrl: 'https://maps.google.com/?cid=1',
      leadSource: LEAD_SOURCE,
      website: 'https://www.smiledental.example/home',
      logoUrl: LOGO,
    });
    expect(result.websitesDropped).toEqual([]);
    expect(company?.emails).toEqual([
      { address: 'hello@smiledental.example', label: 'Work', primary: true },
    ]);
    const note = await ActivityModel.findOne({ relatedId: result.filed[0].companyId }).lean();
    expect(note).toMatchObject({ type: 'NOTE', relatedType: 'COMPANY', done: true });
  });

  it('skips a place already filed, then a domain already in the CRM, then a repeat in the batch', async () => {
    await importLeads([lead()], ASHA);
    await CompanyModel.create({ name: 'Acme', domain: 'acme.example', owner: 'Ravi' });

    const result = await importLeads(
      [
        lead({ name: 'Again' }),
        lead({ placeId: 'place-2', name: 'Acme branch', website: 'https://acme.example' }),
        lead({ placeId: 'place-3', name: 'No site', website: '', phone: '+91 22 5555 0000' }),
        lead({ placeId: 'place-3', name: 'No site', website: '', phone: '+91 22 5555 0000' }),
      ],
      ASHA,
    );

    expect(result.created).toBe(1);
    expect(result.skips.map((skip) => skip.reason)).toEqual([
      'Already in the CRM',
      'A company with the domain acme.example already exists',
      'Already in the CRM',
    ]);
    const filed = await CompanyModel.findById(result.filed[0].companyId).lean();
    expect(filed).toMatchObject({ domain: '', website: '', logoUrl: '' });
    expect(await CompanyModel.countDocuments()).toBe(3);
  });

  it('files a lead whose website does not answer 200 OK without its website, domain or favicon', async () => {
    answers['https://www.smiledental.example/home'] = {
      ok: false,
      reason: 'Answered 404 instead of 200 OK',
      logoUrl: '',
    };

    const result = await importLeads([lead()], ASHA);

    expect(result.created).toBe(1);
    expect(result.websitesDropped).toEqual([
      {
        placeId: 'place-1',
        name: 'Smile Dental',
        website: 'https://www.smiledental.example/home',
        reason: 'Answered 404 instead of 200 OK',
      },
    ]);
    const company = await CompanyModel.findById(result.filed[0].companyId).lean();
    expect(company).toMatchObject({ domain: '', website: '', logoUrl: '' });
  });

  it('files any number of businesses without a website, each with a blank domain', async () => {
    const result = await importLeads(
      [
        lead({ placeId: 'a', name: 'One', website: '', phone: '+91 20 1111 1111' }),
        lead({ placeId: 'b', name: 'Two', website: '', phone: '+91 20 2222 2222' }),
      ],
      ASHA,
    );

    expect(result.created).toBe(2);
    expect(await CompanyModel.countDocuments({ domain: '' })).toBe(2);
    expect(result.websitesDropped).toEqual([]);
  });

  it('still refuses a second company on a real domain', async () => {
    await CompanyModel.init();
    await CompanyModel.create({ name: 'Acme', domain: 'acme.example', owner: '' });
    await expect(
      CompanyModel.create({ name: 'Acme 2', domain: 'acme.example', owner: '' }),
    ).rejects.toMatchObject({
      code: 11000,
    });
  });

  it('visits only the websites that may be saved: new leads and the merges asked for', async () => {
    await CompanyModel.create({ name: 'Acme', domain: 'acme.example', owner: '' });

    await importLeads(
      [lead(), lead({ placeId: 'place-2', name: 'Acme', website: 'https://acme.example' })],
      ASHA,
    );

    expect(checkWebsitesMock).toHaveBeenCalledWith(['https://www.smiledental.example/home']);
  });

  it('merges a duplicate without a website that does not answer 200 OK', async () => {
    const acme = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      city: 'Pune',
      owner: '',
    });
    answers['https://www.smiledental.example/home'] = {
      ok: false,
      reason: 'No answer within 5 seconds',
      logoUrl: '',
    };

    const result = await importLeads([lead({ phone: '' })], ASHA, [
      { placeId: 'place-1', companyId: acme._id.toHexString() },
    ]);

    expect(result.merged).toBe(1);
    expect(result.merges[0].added.map((extra) => extra.field)).not.toContain('website');
    expect(result.websitesDropped).toEqual([
      expect.objectContaining({ placeId: 'place-1', reason: 'No answer within 5 seconds' }),
    ]);
    const company = await CompanyModel.findById(acme._id).lean();
    expect(company?.website).toBe('');
  });

  it('refuses an empty or oversized batch and a lead with no place or coordinates', async () => {
    await expect(importLeads([], ASHA)).rejects.toThrow(/between 1/);
    const many = Array.from({ length: MAX_IMPORT + 1 }, (_v, i) => lead({ placeId: `p${i}` }));
    await expect(importLeads(many, ASHA)).rejects.toThrow(/between 1/);
    await expect(importLeads([lead({ lat: 200 })], ASHA)).rejects.toThrow(/coordinates/);
    await expect(importLeads([lead({ placeId: ' ' })], ASHA)).rejects.toThrow(/Place ID/);
    expect(await CompanyModel.countDocuments()).toBe(0);
  });

  it('keeps only Google Maps links as the map URL', async () => {
    const result = await importLeads([lead({ mapUrl: 'https://evil.example/maps' })], ASHA);
    const company = await CompanyModel.findById(result.filed[0].companyId).lean();
    expect(company?.mapUrl).toBe('');
  });
});
