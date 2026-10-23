import {
  checkedBatch,
  checkedRow,
  domainOf,
  locationOf,
  type LeadImportInput,
} from '../../../../src/modules/google-maps/lead-row';

const row = (over: Partial<LeadImportInput> = {}): LeadImportInput => ({
  placeId: 'place-1',
  name: 'Smile Dental',
  lat: 18.52,
  lng: 73.85,
  ...over,
});

describe('domainOf', () => {
  it('reads http and https hosts, and nothing from a URL it cannot parse', () => {
    expect(domainOf('http://shop.example/a')).toBe('shop.example');
    expect(domainOf('not a url')).toBe('');
    expect(domainOf(null)).toBe('');
    expect(domainOf(undefined)).toBe('');
  });
});

describe('checkedRow', () => {
  it('fills every optional field as empty when the lead leaves it out', () => {
    expect(checkedRow(row())).toEqual({
      placeId: 'place-1',
      name: 'Smile Dental',
      phone: '',
      website: '',
      address: '',
      city: '',
      country: '',
      lat: 18.52,
      lng: 73.85,
      mapUrl: '',
      emails: [],
      primaryType: '',
    });
  });

  it('trims and clips text, upper-cases the country and keeps only real emails', () => {
    const checked = checkedRow(
      row({
        placeId: '  place-1  ',
        name: ` ${'n'.repeat(250)} `,
        phone: ' +91 20 1234 5678 ',
        city: ' Pune ',
        country: 'india',
        emails: [' Hello@Smile.example ', 'nope'],
        primaryType: ' Dentist ',
      }),
    );

    expect(checked).toMatchObject({
      placeId: 'place-1',
      phone: '+91 20 1234 5678',
      city: 'Pune',
      country: 'IN',
      emails: ['hello@smile.example'],
      primaryType: 'Dentist',
    });
    expect(checked.name).toHaveLength(200);
  });

  it('drops a website that is not http(s)', () => {
    expect(checkedRow(row({ website: 'ftp://smile.example' })).website).toBe('');
    expect(checkedRow(row({ website: ' https://smile.example ' })).website).toBe(
      'https://smile.example',
    );
  });

  it('keeps only https links on Google’s own map hosts', () => {
    const mapUrl = (value: string) => checkedRow(row({ mapUrl: value })).mapUrl;
    expect(mapUrl('https://maps.google.com/?cid=1')).toBe('https://maps.google.com/?cid=1');
    expect(mapUrl('https://www.google.com/maps/place/x')).toBe(
      'https://www.google.com/maps/place/x',
    );
    expect(mapUrl('http://maps.google.com/?cid=1')).toBe('');
    expect(mapUrl('https://google.com.evil.example/maps')).toBe('');
    expect(mapUrl('::not a url::')).toBe('');
  });

  it('refuses a lead without a name or with coordinates off the map', () => {
    const message = 'Each lead needs a Place ID, a name and valid coordinates.';
    expect(() => checkedRow(row({ name: '  ' }))).toThrow(message);
    expect(() => checkedRow(row({ lat: Number.NaN }))).toThrow(message);
    expect(() => checkedRow(row({ lng: 181 }))).toThrow(message);
    expect(() => checkedRow(row({ lng: Number.POSITIVE_INFINITY }))).toThrow(message);
  });
});

describe('checkedBatch', () => {
  it('checks every lead of a batch', () => {
    expect(checkedBatch([row(), row({ placeId: 'place-2' })]).map((r) => r.placeId)).toEqual([
      'place-1',
      'place-2',
    ]);
  });
});

describe('locationOf', () => {
  it('joins city and country, skipping either when it is empty', () => {
    expect(locationOf(row({ city: 'Pune', country: 'IN' }))).toBe('Pune, IN');
    expect(locationOf(row({ city: '', country: 'IN' }))).toBe('IN');
    expect(locationOf(row())).toBe('');
  });
});
