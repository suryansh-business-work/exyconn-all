import { suggestLocations } from '../../../../src/modules/google-maps/places.autocomplete';

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
