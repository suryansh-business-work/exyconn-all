import { CompanyModel } from '../../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../../src/modules/crm/contact.model';
import { MAX_NEAR_RADIUS_KM, type CrmNear } from '../../../../../src/modules/crm/records/crm.near';
import {
  searchRecords,
  type CrmQueryInput,
} from '../../../../../src/modules/crm/records/crm.query';
import { distanceMetres } from '../../../../../src/utils/geo';

/** A lean record's name; search rows are typed only by their ids. */
const nameOf = (row: object): unknown => Reflect.get(row, 'name');

const BENGALURU = { lat: 12.9716, lng: 77.5946 };

const query = (near: CrmNear, overrides: Partial<CrmQueryInput> = {}): CrmQueryInput => ({
  page: 0,
  pageSize: 50,
  sorts: [{ property: 'name', dir: 'ASC' }],
  near,
  ...overrides,
});

async function companiesNear(near: CrmNear, overrides: Partial<CrmQueryInput> = {}) {
  const { rows, totalCount } = await searchRecords('COMPANY', query(near, overrides));
  return { names: rows.map(nameOf), totalCount };
}

describe('the "Near a location" filter', () => {
  beforeEach(async () => {
    await CompanyModel.create([
      // About 2.4 km from the centre.
      { name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
      // About 9.4 km, just outside a 9 km circle but inside 10 km.
      { name: 'Whitefield edge', lat: 12.9716, lng: 77.6812 },
      // About 30 km.
      { name: 'Hoskote', lat: 13.0707, lng: 77.7982 },
      { name: 'No position' },
      { name: 'Archived nearby', lat: 12.972, lng: 77.595, archivedAt: new Date() },
    ]);
  });

  it('keeps only the records inside the circle, with a matching total', async () => {
    const edge = distanceMetres(BENGALURU, { lat: 12.9716, lng: 77.6812 }) / 1000;
    expect(edge).toBeGreaterThan(9);
    expect(edge).toBeLessThan(10);

    await expect(companiesNear({ ...BENGALURU, radiusKm: 9 })).resolves.toEqual({
      names: ['Indiranagar'],
      totalCount: 1,
    });
    await expect(companiesNear({ ...BENGALURU, radiusKm: 10 })).resolves.toEqual({
      names: ['Indiranagar', 'Whitefield edge'],
      totalCount: 2,
    });
    await expect(companiesNear({ ...BENGALURU, radiusKm: 50 })).resolves.toMatchObject({
      totalCount: 3,
    });
  });

  it('pages through the circle and keeps the other filters', async () => {
    const near = { ...BENGALURU, radiusKm: 50 };
    await expect(companiesNear(near, { pageSize: 2, page: 1 })).resolves.toEqual({
      names: ['Whitefield edge'],
      totalCount: 3,
    });
    await expect(companiesNear(near, { search: 'hos' })).resolves.toEqual({
      names: ['Hoskote'],
      totalCount: 1,
    });
    await expect(companiesNear(near, { archived: true })).resolves.toEqual({
      names: ['Archived nearby'],
      totalCount: 1,
    });
  });

  it('filters contacts too, and treats a null circle as no filter', async () => {
    await ContactModel.create([
      { name: 'Near', email: 'near@acme.com', lat: 12.98, lng: 77.6 },
      { name: 'Unknown', email: 'unknown@acme.com' },
    ]);
    const near = await searchRecords('CONTACT', query({ ...BENGALURU, radiusKm: 5 }));
    expect(near.rows.map(nameOf)).toEqual(['Near']);
    const all = await searchRecords('CONTACT', { page: 0, pageSize: 50, near: null });
    expect(all.totalCount).toBe(2);
  });

  it('finds records across the 180° meridian', async () => {
    await CompanyModel.create([
      { name: 'Fiji east', lat: -17, lng: 179.95 },
      { name: 'Fiji west', lat: -17, lng: -179.95 },
    ]);
    await expect(companiesNear({ lat: -17, lng: 179.99, radiusKm: 25 })).resolves.toMatchObject({
      names: ['Fiji east', 'Fiji west'],
    });
    await expect(companiesNear({ lat: -17, lng: -179.99, radiusKm: 25 })).resolves.toMatchObject({
      names: ['Fiji east', 'Fiji west'],
    });
  });

  it('reaches every longitude around a pole', async () => {
    await CompanyModel.create([
      { name: 'Station A', lat: 89.9, lng: 0 },
      { name: 'Station B', lat: 89.9, lng: 180 },
    ]);
    await expect(companiesNear({ lat: 90, lng: 0, radiusKm: 20 })).resolves.toMatchObject({
      names: ['Station A', 'Station B'],
    });
  });

  it('refuses a circle that cannot be, and lists without coordinates', async () => {
    const refused = (near: CrmNear) => companiesNear(near);
    await expect(refused({ lat: 91, lng: 0, radiusKm: 1 })).rejects.toThrow(
      'Latitude is from -90 to 90',
    );
    await expect(refused({ lat: 0, lng: -181, radiusKm: 1 })).rejects.toThrow(
      'Longitude is from -180 to 180',
    );
    await expect(refused({ lat: 0, lng: 0, radiusKm: 0 })).rejects.toThrow(
      'The radius must be more than 0 km',
    );
    await expect(refused({ lat: 0, lng: 0, radiusKm: Number.NaN })).rejects.toThrow(
      'The radius must be more than 0 km',
    );
    await expect(refused({ lat: 0, lng: 0, radiusKm: MAX_NEAR_RADIUS_KM + 1 })).rejects.toThrow(
      `The radius is at most ${MAX_NEAR_RADIUS_KM} km`,
    );
    await expect(searchRecords('LEAD', query({ ...BENGALURU, radiusKm: 5 }))).rejects.toThrow(
      'Only companies and contacts can be filtered by location',
    );
  });
});
