import {
  isPlaceId,
  locatePlace,
  suggestLocations,
} from '../../../../src/modules/google-maps/places.autocomplete';

const KEY = process.env.TEST_GOOGLE_KEY ?? 'AIzaTestServerKey000000000000000000';

const answer = (body: unknown, status = 200) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () =>
      typeof body === 'string' ? new Response(body, { status }) : Response.json(body, { status }),
    );

afterEach(() => {
  jest.restoreAllMocks();
});

describe('suggestLocations', () => {
  it('asks Places for regions only, with the server key', async () => {
    const fetchMock = answer({});

    await expect(suggestLocations(KEY, 'Kora')).resolves.toEqual([]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://places.googleapis.com/v1/places:autocomplete');
    expect(new Headers(init?.headers).get('X-Goog-Api-Key')).toBe(KEY);
    expect(JSON.parse(String(init?.body))).toEqual({
      input: 'Kora',
      includedPrimaryTypes: ['(regions)'],
    });
  });

  it('flattens each prediction, falling back to its whole text for the main line', async () => {
    answer({
      suggestions: [
        {
          placePrediction: {
            placeId: 'p1',
            text: { text: 'Koramangala, Bengaluru, India' },
            structuredFormat: {
              mainText: { text: 'Koramangala' },
              secondaryText: { text: 'Bengaluru, India' },
            },
          },
        },
        { placePrediction: { placeId: 'p2', text: { text: 'Kolkata' } } },
      ],
    });

    await expect(suggestLocations(KEY, 'Ko')).resolves.toEqual([
      {
        placeId: 'p1',
        text: 'Koramangala, Bengaluru, India',
        mainText: 'Koramangala',
        secondaryText: 'Bengaluru, India',
      },
      { placeId: 'p2', text: 'Kolkata', mainText: 'Kolkata', secondaryText: '' },
    ]);
  });

  it('drops suggestions that are not places or carry no text', async () => {
    answer({
      suggestions: [
        {},
        { placePrediction: { text: { text: 'No id' } } },
        { placePrediction: { placeId: 'p3' } },
        { placePrediction: { placeId: 'p4', text: { text: '' } } },
        { placePrediction: { placeId: 'p5', text: {} } },
      ],
    });

    await expect(suggestLocations(KEY, 'Ko')).resolves.toEqual([]);
  });

  it('keeps Google’s own error, clipped', async () => {
    answer(`API key not valid. ${'x'.repeat(400)}`, 403);

    await expect(suggestLocations(KEY, 'Ko')).rejects.toThrow(
      /^Google Places suggestions failed \(403\): API key not valid\. x+$/,
    );
    await expect(suggestLocations(KEY, 'Ko')).rejects.toThrow(
      new RegExp(String.raw`\(403\): .{300}$`),
    );
  });
});

describe('locatePlace', () => {
  it('reads only the location of the place, with the server key', async () => {
    const fetchMock = answer({ location: { latitude: 12.97, longitude: 77.59 } });

    await expect(locatePlace(KEY, 'ChIJ-abc_1')).resolves.toEqual({ lat: 12.97, lng: 77.59 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://places.googleapis.com/v1/places/ChIJ-abc_1');
    const headers = new Headers(init?.headers);
    expect(headers.get('X-Goog-Api-Key')).toBe(KEY);
    expect(headers.get('X-Goog-FieldMask')).toBe('location');
  });

  it('refuses a place Google gives no location for', async () => {
    answer({ location: { latitude: 12.97 } });
    await expect(locatePlace(KEY, 'p1')).rejects.toThrow('Google Places has no location');
    answer({});
    await expect(locatePlace(KEY, 'p1')).rejects.toThrow('Google Places has no location');
  });

  it('keeps Google’s own error, clipped', async () => {
    answer(`Not found ${'x'.repeat(400)}`, 404);
    await expect(locatePlace(KEY, 'p1')).rejects.toThrow(
      /^Google Places location failed \(404\): Not found x{290}$/,
    );
  });
});

describe('isPlaceId', () => {
  it('accepts Place IDs and nothing that could change the URL', () => {
    expect(isPlaceId('ChIJN1t_tDeuEmsRUsoyG83frY4')).toBe(true);
    expect(isPlaceId('')).toBe(false);
    expect(isPlaceId('../admin')).toBe(false);
    expect(isPlaceId('a'.repeat(301))).toBe(false);
  });
});
