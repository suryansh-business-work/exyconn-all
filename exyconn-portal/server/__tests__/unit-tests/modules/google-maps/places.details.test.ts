import { Types } from 'mongoose';
import type { GraphQLError } from 'graphql';
import { ROLES } from '../../../../src/constants/roles';
import { assertPermission } from '../../../../src/lib/permissions';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { GoogleMapsConfigModel } from '../../../../src/modules/google-maps/google-maps-config.model';
import {
  companyGoogleBusiness,
  toGoogleBusiness,
} from '../../../../src/modules/google-maps/places.details';

jest.mock('../../../../src/lib/permissions', () => ({
  ...jest.requireActual('../../../../src/lib/permissions'),
  assertPermission: jest.fn(),
}));

const KEY = process.env.TEST_GOOGLE_KEY ?? 'AIzaTestServerKey000000000000000000';
const sales: GraphQLContext = {
  user: { id: new Types.ObjectId().toHexString(), roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'OK',
    (error: unknown) => (error as GraphQLError).extensions?.code,
  );

const fullPlace = {
  id: 'place-1',
  displayName: { text: 'Smile Dental' },
  formattedAddress: '12 MG Road, Pune',
  internationalPhoneNumber: '+91 20 1234 5678',
  websiteUri: 'https://smile.example',
  googleMapsUri: 'https://maps.google.com/?cid=1',
  rating: 4.6,
  userRatingCount: 120,
  businessStatus: 'OPERATIONAL',
  priceLevel: 'PRICE_LEVEL_MODERATE',
  editorialSummary: { text: 'Family dentist.' },
  primaryTypeDisplayName: { text: 'Dentist' },
  types: ['dentist', 'health'],
  regularOpeningHours: { weekdayDescriptions: ['Monday: 9 AM – 6 PM'] },
  reviews: [
    {
      name: 'places/place-1/reviews/r1',
      rating: 5,
      text: { text: 'Great care.' },
      relativePublishTimeDescription: 'a week ago',
      publishTime: '2026-10-10T10:00:00Z',
      authorAttribution: { displayName: 'Asha', uri: 'https://g.example/a', photoUri: 'p.jpg' },
    },
    { originalText: { text: 'Muy bien.' } },
    {},
  ],
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('toGoogleBusiness', () => {
  it('flattens a full profile, each review with its author', () => {
    const business = toGoogleBusiness(fullPlace);

    expect(business).toMatchObject({
      placeId: 'place-1',
      name: 'Smile Dental',
      address: '12 MG Road, Pune',
      phone: '+91 20 1234 5678',
      website: 'https://smile.example',
      mapUrl: 'https://maps.google.com/?cid=1',
      rating: 4.6,
      ratingCount: 120,
      businessStatus: 'OPERATIONAL',
      priceLevel: 'PRICE_LEVEL_MODERATE',
      summary: 'Family dentist.',
      category: 'Dentist',
      types: ['dentist', 'health'],
      openingHours: ['Monday: 9 AM – 6 PM'],
    });
    expect(business.reviews).toEqual([
      {
        id: 'places/place-1/reviews/r1',
        authorName: 'Asha',
        authorUrl: 'https://g.example/a',
        authorPhotoUrl: 'p.jpg',
        rating: 5,
        text: 'Great care.',
        relativeTime: 'a week ago',
        publishedAt: '2026-10-10T10:00:00Z',
      },
      // A review without an id is numbered by its place in the list; untranslated text is used.
      expect.objectContaining({ id: '1', text: 'Muy bien.', authorName: '', rating: null }),
      expect.objectContaining({ id: '2', text: '', relativeTime: '', publishedAt: null }),
    ]);
  });

  it('reads blanks for everything a sparse profile leaves out', () => {
    expect(
      toGoogleBusiness({
        id: 'place-2',
        displayName: {},
        editorialSummary: {},
        primaryTypeDisplayName: {},
        regularOpeningHours: {},
        reviews: [{ authorAttribution: {}, text: {} }],
      }),
    ).toEqual({
      placeId: 'place-2',
      name: '',
      address: '',
      phone: '',
      website: '',
      mapUrl: '',
      rating: null,
      ratingCount: null,
      businessStatus: '',
      priceLevel: '',
      summary: '',
      category: '',
      types: [],
      openingHours: [],
      reviews: [
        {
          id: '0',
          authorName: '',
          authorUrl: '',
          authorPhotoUrl: '',
          rating: null,
          text: '',
          relativeTime: '',
          publishedAt: null,
        },
      ],
    });
    expect(toGoogleBusiness({ id: 'place-3' })).toMatchObject({ name: '', reviews: [] });
  });
});

describe('companyGoogleBusiness', () => {
  const ask = (companyId: string) => companyGoogleBusiness(null, { companyId }, sales);

  it('is for CRM users who may view companies, and unknown companies are not found', async () => {
    await expect(codeOf(ask('not-an-id'))).resolves.toBe('NOT_FOUND');
    await expect(codeOf(ask(new Types.ObjectId().toHexString()))).resolves.toBe('NOT_FOUND');
    expect(assertPermission).toHaveBeenCalledWith(sales, 'Company', [ROLES.CRM], 'VIEW');
  });

  it('is null for a company not filed from Google Places, without calling Google', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch');
    const company = await CompanyModel.create({ name: 'Acme', domain: 'acme.example', owner: '' });

    await expect(ask(company._id.toHexString())).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads the profile live from Places with the active key and a field mask', async () => {
    await GoogleMapsConfigModel.create({ label: 'Main', serverKey: KEY, isActive: true });
    const company = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      owner: '',
      placeId: 'places/a b',
    });
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(fullPlace));

    const first = await ask(company._id.toHexString());
    await ask(company._id.toHexString());

    expect(first).toMatchObject({ name: 'Smile Dental', rating: 4.6 });
    // Never cached: every view asks Google again.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://places.googleapis.com/v1/places/places%2Fa%20b');
    const headers = new Headers(init?.headers);
    expect(headers.get('X-Goog-Api-Key')).toBe(KEY);
    expect(headers.get('X-Goog-FieldMask')).toContain('reviews');
  });

  it('keeps Google’s error when Places refuses', async () => {
    await GoogleMapsConfigModel.create({ label: 'Main', serverKey: KEY, isActive: true });
    const company = await CompanyModel.create({
      name: 'Smile Dental',
      domain: 'smile.example',
      owner: '',
      placeId: 'place-1',
    });
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('Place ID is no longer valid', { status: 404 }));

    await expect(ask(company._id.toHexString())).rejects.toThrow(
      'Google Places details failed (404): Place ID is no longer valid',
    );
  });
});
