import { youtube } from '../../../../../src/modules/social-accounts/networks/youtube';
import { count, withLink } from '../../../../../src/modules/social-accounts/networks/network.types';
import { NETWORKS } from '../../../../../src/modules/social-accounts/networks';
import { fakeFetch } from '../social.fixtures';

const CHANNEL = { externalId: 'UC 1', accessToken: 'yt-token' };
const uploads = { items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU1' } } }] };

afterEach(() => jest.restoreAllMocks());

describe('YouTube reading', () => {
  it('reads nothing for a channel without an uploads playlist', async () => {
    const calls = fakeFetch([[/channels\?/, 200, { items: [] }]]);
    expect(await youtube.fetchPosts(CHANNEL)).toEqual([]);
    expect(calls[0].url).toContain('id=UC%201');
    expect(calls).toHaveLength(1);
  });

  it('reads nothing when the uploads playlist is empty', async () => {
    const calls = fakeFetch([
      [/channels\?/, 200, uploads],
      [/playlistItems/, 200, { items: [{ contentDetails: {} }, {}] }],
    ]);
    expect(await youtube.fetchPosts(CHANNEL)).toEqual([]);
    expect(calls).toHaveLength(2);
  });

  it('reads a video’s thumbnail, and zeroes the numbers it does not share', async () => {
    fakeFetch([
      [/channels\?/, 200, uploads],
      [/playlistItems/, 200, { items: [{ contentDetails: { videoId: 'v1' } }] }],
      [
        /videos\?/,
        200,
        {
          items: [
            {
              id: 'v1',
              snippet: {
                title: 'Demo',
                publishedAt: '2026-09-18T00:00:00Z',
                thumbnails: { medium: { url: 'https://yt/v1.jpg' } },
              },
            },
          ],
        },
      ],
    ]);
    expect(await youtube.fetchPosts(CHANNEL)).toEqual([
      {
        externalId: 'v1',
        text: 'Demo',
        mediaUrl: 'https://yt/v1.jpg',
        permalink: 'https://www.youtube.com/watch?v=v1',
        publishedAt: new Date('2026-09-18T00:00:00Z'),
        metrics: { likes: 0, comments: 0, shares: 0, views: 0 },
      },
    ]);
  });

  it('copes with a video that comes back without its snippet', async () => {
    fakeFetch([
      [/channels\?/, 200, uploads],
      [/playlistItems/, 200, { items: [{ contentDetails: { videoId: 'v2' } }] }],
      [/videos\?/, 200, { items: [{ id: 'v2', statistics: { viewCount: '9' } }] }],
    ]);
    const [video] = (await youtube.fetchPosts(CHANNEL)) ?? [];
    expect(video).toMatchObject({ externalId: 'v2', text: '', mediaUrl: '' });
    expect(video.metrics.views).toBe(9);
  });

  it('publishes nothing — a YouTube post is a video upload', () => {
    expect(youtube.publish).toBeNull();
    expect(NETWORKS.YOUTUBE).toBe(youtube);
  });
});

describe('network helpers', () => {
  it('reads numbers given as numbers or numeric strings, and zero for anything else', () => {
    expect(count(7)).toBe(7);
    expect(count('12')).toBe(12);
    expect(count('many')).toBe(0);
    expect(count(undefined)).toBe(0);
  });

  it('adds a link to the text only when it is not already there', () => {
    expect(withLink({ text: 'Hi', mediaUrl: '', link: 'https://e.com' })).toBe(
      'Hi\n\nhttps://e.com',
    );
    expect(withLink({ text: 'See https://e.com', mediaUrl: '', link: 'https://e.com' })).toBe(
      'See https://e.com',
    );
    expect(withLink({ text: 'Hi', mediaUrl: '', link: '' })).toBe('Hi');
    expect(withLink({ text: '', mediaUrl: '', link: 'https://e.com' })).toBe('https://e.com');
  });
});
