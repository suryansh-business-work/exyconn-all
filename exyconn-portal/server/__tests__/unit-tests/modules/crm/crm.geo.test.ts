import {
  companyGeoFields,
  contactGeoFields,
  crmGeoResolvers,
} from '../../../../src/modules/crm/crm.geo';

const { Company, Contact } = crmGeoResolvers;

describe('CRM map fields', () => {
  it('indexes the Place ID on companies only', () => {
    expect(companyGeoFields.placeId.index).toBe(true);
    expect(contactGeoFields.placeId.index).toBe(false);
    expect(companyGeoFields).toHaveProperty('leadSource');
    expect(contactGeoFields).not.toHaveProperty('leadSource');
  });

  it('reads stored coordinates and links', () => {
    const row = {
      lat: 12.97,
      lng: 77.59,
      placeId: 'ChIJ1',
      mapUrl: 'https://maps.google.com/?cid=1',
    };
    expect(Company.lat(row)).toBe(12.97);
    expect(Contact.lng(row)).toBe(77.59);
    expect(Company.placeId(row)).toBe('ChIJ1');
    expect(Contact.mapUrl(row)).toBe('https://maps.google.com/?cid=1');
    expect(Company.leadSource({ leadSource: 'Google Places' })).toBe('Google Places');
  });

  it('reads rows saved before the fields existed, or with unusable values, as empty', () => {
    expect(Company.lat({})).toBeNull();
    expect(Company.lng({ lng: Number.NaN })).toBeNull();
    expect(Contact.lat({ lat: Infinity })).toBeNull();
    expect(Contact.lat({ lat: '12.9' })).toBeNull();
    expect(Company.placeId({})).toBe('');
    expect(Company.leadSource({})).toBe('');
  });
});
