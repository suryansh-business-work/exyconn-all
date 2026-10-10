import { ConfigurationError } from '../../../src/utils/errors';
import { isPexelsMediaUrl, pexelsClient } from '../../../src/utils/pexels';
import {
  PexelsConfigModel,
  type PexelsConfigDocument,
} from '../../../src/modules/tech/pexels-config.model';
import { asArg } from '../../mockAs';

const withProtocol = (url: string, protocol: string): string => {
  const parsed = new URL(url);
  parsed.protocol = protocol;
  return parsed.href;
};

const apiKey = `pexels-${Date.now()}`;
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

let fetchMock: jest.SpyInstance;

function activeKey(key: string | null) {
  return jest
    .spyOn(PexelsConfigModel, 'findOne')
    .mockReturnValue(asArg({ lean: jest.fn().mockResolvedValue(key ? { apiKey: key } : null) }));
}

/** The query string of the one request made. */
function sentUrl(): URL {
  return new URL(String(fetchMock.mock.calls[0][0]));
}

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('isPexelsMediaUrl', () => {
  it('accepts only https URLs on the Pexels CDN', () => {
    expect(isPexelsMediaUrl('https://images.pexels.com/photos/1/a.jpeg')).toBe(true);
    expect(isPexelsMediaUrl(withProtocol('https://images.pexels.com/a.jpeg', 'http:'))).toBe(false);
    expect(isPexelsMediaUrl('https://pexels.com.evil.test/a.jpeg')).toBe(false);
    expect(isPexelsMediaUrl('not a url')).toBe(false);
  });
});

describe('searchPhotos', () => {
  it('sends the key and only the filters that were set', async () => {
    activeKey(apiKey);
    fetchMock.mockResolvedValue(json({ photos: [] }));
    await pexelsClient.searchPhotos('office desk', 2, {
      orientation: 'landscape',
      size: '',
      color: null,
      minDuration: undefined,
    });
    const url = sentUrl();
    expect(url.origin + url.pathname).toBe('https://api.pexels.com/v1/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      query: 'office desk',
      per_page: '24',
      page: '2',
      orientation: 'landscape',
    });
    expect(fetchMock.mock.calls[0][1]).toEqual({ headers: { Authorization: apiKey } });
  });

  it('flattens each photo to what the grid renders', async () => {
    activeKey(apiKey);
    fetchMock.mockResolvedValue(
      json({
        photos: [
          { id: 7, alt: 'A desk', photographer: 'Lee', src: { medium: 'm.jpg', large2x: 'l.jpg' } },
          { id: 8, alt: null, photographer: 'Kim', src: { medium: 'm2.jpg', large2x: 'l2.jpg' } },
        ],
      }),
    );
    await expect(pexelsClient.searchPhotos('desk', 1, {})).resolves.toEqual([
      { id: '7', previewUrl: 'm.jpg', url: 'l.jpg', alt: 'A desk', credit: 'Lee', duration: 0 },
      { id: '8', previewUrl: 'm2.jpg', url: 'l2.jpg', alt: '', credit: 'Kim', duration: 0 },
    ]);
  });

  it('refuses when no Pexels configuration is active', async () => {
    activeKey(null);
    await expect(pexelsClient.searchPhotos('desk', 1, {})).rejects.toBeInstanceOf(
      ConfigurationError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a failed search with its status and a short detail', async () => {
    activeKey(apiKey);
    fetchMock.mockResolvedValue(new Response('y'.repeat(300), { status: 401 }));
    await expect(pexelsClient.searchPhotos('desk', 1, {})).rejects.toThrow(
      /^Pexels \/v1\/search\?.* failed \(401\): y{200}$/,
    );
  });
});

describe('searchVideos', () => {
  it('sends the duration filters and picks the HD mp4 rendition', async () => {
    activeKey(apiKey);
    fetchMock.mockResolvedValue(
      json({
        videos: [
          {
            id: 1,
            image: 'poster.jpg',
            duration: 12,
            user: { name: 'Ana' },
            video_files: [
              { quality: 'sd', file_type: 'video/mp4', link: 'sd.mp4' },
              { quality: 'hd', file_type: 'video/webm', link: 'hd.webm' },
              { quality: 'hd', file_type: 'video/mp4', link: 'hd.mp4' },
            ],
          },
        ],
      }),
    );
    const results = await pexelsClient.searchVideos('city', 1, { minDuration: 5, maxDuration: 30 });
    expect(results).toEqual([
      {
        id: '1',
        previewUrl: 'poster.jpg',
        url: 'hd.mp4',
        alt: 'Stock video by Ana',
        credit: 'Ana',
        duration: 12,
      },
    ]);
    const url = sentUrl();
    expect(url.pathname).toBe('/videos/search');
    expect(url.searchParams.get('min_duration')).toBe('5');
    expect(url.searchParams.get('max_duration')).toBe('30');
  });

  it('falls back to the first file, and skips a video with none', async () => {
    activeKey(apiKey);
    fetchMock.mockResolvedValue(
      json({
        videos: [
          {
            id: 2,
            image: 'p.jpg',
            duration: 3,
            user: { name: 'Bo' },
            video_files: [{ quality: 'sd', file_type: 'video/mp4', link: 'first.mp4' }],
          },
          { id: 3, image: 'p3.jpg', duration: 4, user: { name: 'Cy' }, video_files: [] },
        ],
      }),
    );
    const results = await pexelsClient.searchVideos('city', 1, {});
    expect(results.map((item) => item.url)).toEqual(['first.mp4']);
  });
});

describe('verify', () => {
  it('runs one cheap search through the given configuration', async () => {
    const findOne = activeKey(null);
    fetchMock.mockResolvedValue(json({ photos: [] }));
    await pexelsClient.verify({ apiKey, label: 'Stock' } as PexelsConfigDocument);
    expect(findOne).not.toHaveBeenCalled();
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://api.pexels.com/v1/search?query=office&per_page=1&page=1',
    );
  });
});
