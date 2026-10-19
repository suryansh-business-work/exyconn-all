import {
  activeServerKey,
  MAX_RADIUS_METERS,
  PAGE_SIZE,
  searchBody,
  searchText,
  toLeadPlace,
} from '../../../../src/modules/google-maps/places.client';
import { GoogleMapsConfigModel } from '../../../../src/modules/google-maps/google-maps-config.model';
import { ConfigurationError } from '../../../../src/utils/errors';

const KEY = process.env.TEST_GOOGLE_KEY ?? 'test-server-key';

const PLACE = {
  id: 'place-1',
  displayName: { text: 'Smile Dental' },
  formattedAddress: '12 MG Road, Pune 411001, India',
  addressComponents: [
    { longText: 'Pune', shortText: 'Pune', types: ['locality', 'political'] },
    { longText: 'India', shortText: 'in', types: ['country', 'political'] },
  ],
  location: { latitude: 18.52, longitude: 73.85 },
  nationalPhoneNumber: '020 1234 5678',
  internationalPhoneNumber: '+91 20 1234 5678',
  websiteUri: 'https://smiledental.example',
  rating: 4.6,
  userRatingCount: 120,
  googleMapsUri: 'https://maps.google.com/?cid=1',
  types: ['dentist', 'health'],
  primaryTypeDisplayName: { text: 'Dentist' },
};

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('searchBody', () => {
  it('puts a typed place into the text query', () => {
    expect(searchBody({ query: 'dentists', location: 'Pune' })).toEqual({
      textQuery: 'dentists in Pune',
      pageSize: PAGE_SIZE,
    });
  });

  it('biases to a circle around the centre, clamping the radius, and passes type and page', () => {
    const body = searchBody({
      query: 'dentists',
      location: 'ignored',
      lat: 18.5,
      lng: 73.8,
      radiusMeters: 999_999,
      type: 'dentist',
      pageToken: 'next',
    });
    expect(body).toEqual({
      textQuery: 'dentists',
      pageSize: PAGE_SIZE,
      locationBias: {
        circle: { center: { latitude: 18.5, longitude: 73.8 }, radius: MAX_RADIUS_METERS },
      },
      includedType: 'dentist',
      pageToken: 'next',
    });
  });
});

describe('toLeadPlace', () => {
  it('flattens a Places result: city, upper-case country, international phone', () => {
    expect(toLeadPlace(PLACE)).toEqual({
      placeId: 'place-1',
      name: 'Smile Dental',
      address: '12 MG Road, Pune 411001, India',
      city: 'Pune',
      country: 'IN',
      phone: '+91 20 1234 5678',
      website: 'https://smiledental.example',
      rating: 4.6,
      ratingCount: 120,
      lat: 18.52,
      lng: 73.85,
      mapUrl: 'https://maps.google.com/?cid=1',
      types: ['dentist', 'health'],
      primaryType: 'Dentist',
    });
  });

  it('drops a result with no location, and defaults the optional fields', () => {
    expect(toLeadPlace({ id: 'x' })).toBeNull();
    expect(toLeadPlace({ id: 'y', location: { latitude: 1, longitude: 2 } })).toMatchObject({
      name: '',
      city: '',
      country: '',
      phone: '',
      website: '',
      rating: null,
      types: [],
    });
  });
});

describe('searchText', () => {
  it('sends the key and field mask in headers and returns the mapped page', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        Response.json({ places: [PLACE, { id: 'no-location' }], nextPageToken: 'tok' }),
      );
    globalThis.fetch = fetchMock;

    const page = await searchText(KEY, { query: 'dentists', location: 'Pune' });

    expect(page.nextPageToken).toBe('tok');
    expect(page.places.map((place) => place.placeId)).toEqual(['place-1']);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://places.googleapis.com/v1/places:searchText');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Goog-Api-Key']).toBe(KEY);
    expect(headers['X-Goog-FieldMask']).toContain('places.websiteUri');
    expect(JSON.parse(init.body as string)).toMatchObject({ textQuery: 'dentists in Pune' });
  });

  it("keeps Google's own error message", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(new Response('API key not valid', { status: 400 }));
    await expect(searchText(KEY, { query: 'x' })).rejects.toThrow(/400.*API key not valid/);
  });
});

describe('activeServerKey', () => {
  it('is a configuration error until an active config has a server key', async () => {
    await expect(activeServerKey()).rejects.toBeInstanceOf(ConfigurationError);
    await GoogleMapsConfigModel.create({ label: 'Off', serverKey: KEY, isActive: false });
    await expect(activeServerKey()).rejects.toBeInstanceOf(ConfigurationError);
    await GoogleMapsConfigModel.create({ label: 'On', serverKey: KEY, isActive: true });
    await expect(activeServerKey()).resolves.toBe(KEY);
  });
});
