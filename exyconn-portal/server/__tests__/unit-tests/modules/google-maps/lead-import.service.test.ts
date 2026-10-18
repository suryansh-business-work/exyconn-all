import {
  domainOf,
  importLeads,
  LEAD_SOURCE,
  MAX_IMPORT,
  placeholderDomain,
  type LeadImportInput,
} from '../../../../src/modules/google-maps/lead-import.service';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ActivityModel } from '../../../../src/modules/crm/activity.model';

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

describe('domainOf / placeholderDomain', () => {
  it('reads the host without www, and nothing from a non-web URL', () => {
    expect(domainOf('https://www.Acme.example/x')).toBe('acme.example');
    expect(domainOf('javascript:alert(1)')).toBe('');
    expect(domainOf('')).toBe('');
  });

  it('gives a business with no website a stable, reserved, unique domain', () => {
    const one = placeholderDomain('Café Ünïque & Co', 'place-a');
    expect(one).toMatch(/^cafe-unique-co-[\da-f]{8}\.no-website\.invalid$/);
    expect(placeholderDomain('Café Ünïque & Co', 'place-a')).toBe(one);
    expect(placeholderDomain('Café Ünïque & Co', 'place-b')).not.toBe(one);
  });
});

describe('importLeads', () => {
  it('files a company with its contact points, map and source, and notes it on the timeline', async () => {
    const result = await importLeads([lead()], 'Asha');

    expect(result).toMatchObject({ created: 1, skipped: 0, skips: [] });
    const company = await CompanyModel.findById(result.filed[0].companyId).lean();
    expect(company).toMatchObject({
      name: 'Smile Dental',
      domain: 'smiledental.example',
      owner: 'Asha',
      status: 'PROSPECT',
      phone: '+91 20 1234 5678',
      country: 'IN',
      lat: 18.52,
      lng: 73.85,
      placeId: 'place-1',
      mapUrl: 'https://maps.google.com/?cid=1',
      leadSource: LEAD_SOURCE,
    });
    expect(company?.emails).toEqual([
      { address: 'hello@smiledental.example', label: 'Work', primary: true },
    ]);
    const note = await ActivityModel.findOne({ relatedId: result.filed[0].companyId }).lean();
    expect(note).toMatchObject({ type: 'NOTE', relatedType: 'COMPANY', done: true });
  });

  it('skips a place already filed, then a domain already in the CRM, then a repeat in the batch', async () => {
    await importLeads([lead()], 'Asha');
    await CompanyModel.create({ name: 'Acme', domain: 'acme.example', owner: 'Ravi' });

    const result = await importLeads(
      [
        lead({ name: 'Again' }),
        lead({ placeId: 'place-2', name: 'Acme branch', website: 'https://acme.example' }),
        lead({ placeId: 'place-3', name: 'No site', website: '', phone: '+91 22 5555 0000' }),
        lead({ placeId: 'place-3', name: 'No site', website: '', phone: '+91 22 5555 0000' }),
      ],
      'Asha',
    );

    expect(result.created).toBe(1);
    expect(result.skips.map((skip) => skip.reason)).toEqual([
      'Already in the CRM',
      'A company with the domain acme.example already exists',
      'Already in the CRM',
    ]);
    const filed = await CompanyModel.findById(result.filed[0].companyId).lean();
    expect(filed?.domain).toMatch(/\.no-website\.invalid$/);
    expect(await CompanyModel.countDocuments()).toBe(3);
  });

  it('refuses an empty or oversized batch and a lead with no place or coordinates', async () => {
    await expect(importLeads([], 'Asha')).rejects.toThrow(/between 1/);
    const many = Array.from({ length: MAX_IMPORT + 1 }, (_v, i) => lead({ placeId: `p${i}` }));
    await expect(importLeads(many, 'Asha')).rejects.toThrow(/between 1/);
    await expect(importLeads([lead({ lat: 200 })], 'Asha')).rejects.toThrow(/coordinates/);
    await expect(importLeads([lead({ placeId: ' ' })], 'Asha')).rejects.toThrow(/Place ID/);
    expect(await CompanyModel.countDocuments()).toBe(0);
  });

  it('keeps only Google Maps links as the map URL', async () => {
    const result = await importLeads([lead({ mapUrl: 'https://evil.example/maps' })], 'Asha');
    const company = await CompanyModel.findById(result.filed[0].companyId).lean();
    expect(company?.mapUrl).toBe('');
  });
});
