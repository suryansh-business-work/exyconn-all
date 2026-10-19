import { Types } from 'mongoose';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import {
  companyMatcher,
  leadExtras,
  newEmails,
  newPhones,
  phonesOf,
  type CompanyCandidate,
} from '../../../../src/modules/google-maps/lead-match';
import type { LeadImportInput } from '../../../../src/modules/google-maps/lead-row';

const lead = (over: Partial<LeadImportInput> = {}): LeadImportInput => ({
  placeId: 'place-1',
  name: 'Smile Dental',
  lat: 18.52,
  lng: 73.85,
  ...over,
});

const company = (over: Partial<CompanyCandidate> = {}): CompanyCandidate => ({
  _id: new Types.ObjectId(),
  name: 'Smile Dental',
  domain: 'smile.example',
  ...over,
});

describe('phonesOf', () => {
  it('reads the list, else the one phone saved before the list existed, else nothing', () => {
    const phones = [{ number: '+91 20 1234 5678', label: 'Office', primary: true }];
    expect(phonesOf(company({ phones, phone: '111' }))).toBe(phones);
    expect(phonesOf(company({ phones: [], phone: '020 1234 5678' }))).toEqual([
      { number: '020 1234 5678', label: 'Work', primary: true },
    ]);
    expect(phonesOf(company({ phones: null, phone: '' }))).toEqual([]);
    expect(phonesOf(company())).toEqual([]);
  });
});

describe('newEmails / newPhones', () => {
  it('brings only the emails the company lacks, once each', () => {
    const known = company({ emails: [{ address: 'Hello@Smile.example' }] });
    expect(
      newEmails(lead({ emails: ['hello@smile.example', 'new@smile.example', 'new@smile.example'] }), known),
    ).toEqual(['new@smile.example']);
    expect(newEmails(lead({ emails: null }), known)).toEqual([]);
    expect(newEmails(lead({ emails: ['a@x.test'] }), company())).toEqual(['a@x.test']);
  });

  it('brings the lead’s phone only when no number on the company is the same one', () => {
    const known = company({ phone: '020 1234 5678' });
    expect(newPhones(lead(), known)).toEqual([]);
    expect(newPhones(lead({ phone: '+91 20 1234 5678' }), known)).toEqual([]);
    expect(newPhones(lead({ phone: '+91 22 5555 0000' }), known)).toEqual(['+91 22 5555 0000']);
  });
});

describe('leadExtras', () => {
  it('lists every empty field the lead fills, the map position and new contact points', () => {
    const full = lead({
      website: 'https://smile.example',
      address: '12 MG Road',
      city: 'Pune',
      country: 'IN',
      primaryType: 'Dentist',
      mapUrl: 'https://maps.google.com/?cid=1',
      emails: ['new@smile.example'],
      phone: '+91 22 5555 0000',
    });
    const existing = company({
      website: '  ',
      city: null,
      emails: [{ address: 'a@smile.example' }, { address: 'b@smile.example' }],
      phones: [{ number: '+91 20 1234 5678' }],
    });

    expect(leadExtras(full, existing)).toEqual([
      { field: 'website', label: 'Website', current: '', incoming: 'https://smile.example' },
      { field: 'address', label: 'Address', current: '', incoming: '12 MG Road' },
      { field: 'city', label: 'City', current: '', incoming: 'Pune' },
      { field: 'country', label: 'Country', current: '', incoming: 'IN' },
      { field: 'location', label: 'Location', current: '', incoming: 'Pune, IN' },
      { field: 'industry', label: 'Industry', current: '', incoming: 'Dentist' },
      {
        field: 'mapUrl',
        label: 'Google Maps link',
        current: '',
        incoming: 'https://maps.google.com/?cid=1',
      },
      { field: 'placeId', label: 'Google Place ID', current: '', incoming: 'place-1' },
      { field: 'coordinates', label: 'Map position', current: '', incoming: '18.52, 73.85' },
      {
        field: 'emails',
        label: 'Email',
        current: 'a@smile.example, b@smile.example',
        incoming: 'new@smile.example',
      },
      { field: 'phones', label: 'Phone', current: '+91 20 1234 5678', incoming: '+91 22 5555 0000' },
    ]);
  });

  it('never offers to change what is filled in, nor to fill from a blank lead field', () => {
    const filled = company({
      website: 'https://old.example',
      address: 'Old road',
      city: 'Pune',
      country: 'IN',
      location: 'Pune, IN',
      industry: 'Clinic',
      mapUrl: 'https://maps.google.com/?cid=9',
      placeId: 'place-9',
      lat: 1,
      lng: null,
    });

    expect(leadExtras(lead({ website: 'https://smile.example' }), filled)).toEqual([]);
    expect(leadExtras(lead(), company({ placeId: 'place-1', lat: null, lng: 2 }))).toEqual([]);
  });
});

describe('companyMatcher', () => {
  const create = (fields: Record<string, unknown>) =>
    CompanyModel.create({ owner: '', ...fields }).then((row) => row._id);

  it('matches by Place ID, then domain, then phone, then the exact name in the same city', async () => {
    const byPlace = await create({ name: 'Placed', domain: 'placed.example', placeId: 'place-1' });
    const byDomain = await create({ name: 'Acme', domain: 'acme.example' });
    const byPhone = await create({
      name: 'Phoned',
      domain: 'phoned.example',
      phones: [{ number: '020 5555 0000', label: 'Work', primary: true }],
    });
    const byName = await create({ name: 'Bright Dental', domain: 'bright.example', city: 'Pune' });
    const rows = [
      lead({ website: 'https://acme.example' }),
      lead({ placeId: 'p2', website: 'https://www.acme.example/x' }),
      lead({ placeId: 'p3', phone: '+91 20 5555 0000' }),
      lead({ placeId: 'p4', name: 'bright dental', city: 'PUNE' }),
      lead({ placeId: 'p5', name: 'Bright Dental', city: 'Mumbai' }),
      lead({ placeId: 'p6', name: 'Bright Dental' }),
    ];

    const matcher = await companyMatcher(rows);

    const matches = rows.map((row) => matcher.match(row));
    expect(matches.slice(0, 4).map((m) => [m?.kind, m?.company._id.toHexString()])).toEqual([
      ['PLACE', byPlace.toHexString()],
      ['DOMAIN', byDomain.toHexString()],
      ['PHONE', byPhone.toHexString()],
      ['NAME', byName.toHexString()],
    ]);
    expect(matches.slice(4)).toEqual([null, null]);
  });

  it('remembers companies filed or updated during the import', async () => {
    const matcher = await companyMatcher([lead({ placeId: 'p7', website: 'https://new.example' })]);
    expect(matcher.match(lead({ placeId: 'p7' }))).toBeNull();

    const filed = company({ domain: 'new.example', placeId: 'p7' });
    matcher.remember(filed);
    expect(matcher.match(lead({ placeId: 'p7' }))?.company).toBe(filed);

    const updated = { ...filed, placeId: 'p8' };
    matcher.remember(updated);
    expect(matcher.match(lead({ placeId: 'p7' }))).toBeNull();
    expect(matcher.match(lead({ placeId: 'p8' }))?.company).toBe(updated);
  });
});
