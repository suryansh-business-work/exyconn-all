import { facebook, instagram } from '../../../../../src/modules/social-accounts/networks/meta';
import { fakeFetch, formOf } from '../social.fixtures';

const PAGE = { externalId: 'page-1', accessToken: 'page-token' };
const IG = { externalId: 'ig-1', accessToken: 'page-token' };

afterEach(() => jest.restoreAllMocks());

describe('Facebook publishing', () => {
  it('posts a photo with the link in its caption', async () => {
    const calls = fakeFetch([[/page-1\/photos/, 200, { id: 'photo-1', post_id: 'page-1_99' }]]);
    const published = await facebook.publish?.(PAGE, {
      text: 'Launch',
      mediaUrl: 'https://img/a.png',
      link: 'https://exyconn.com',
    });
    expect(published).toEqual({
      externalId: 'page-1_99',
      permalink: 'https://www.facebook.com/page-1_99',
    });
    expect(formOf(calls[0])).toEqual({
      access_token: 'page-token',
      url: 'https://img/a.png',
      caption: 'Launch\n\nhttps://exyconn.com',
    });
  });

  it('posts a photo with only its text as the caption', async () => {
    const calls = fakeFetch([[/page-1\/photos/, 200, { id: 'photo-2' }]]);
    const published = await facebook.publish?.(PAGE, {
      text: 'Launch',
      mediaUrl: 'https://img/a.png',
      link: '',
    });
    expect(published?.externalId).toBe('photo-2');
    expect(formOf(calls[0]).caption).toBe('Launch');
  });

  it('posts plain text to the feed without a link field', async () => {
    const calls = fakeFetch([[/page-1\/feed/, 200, { id: 'post-3' }]]);
    await facebook.publish?.(PAGE, { text: 'Hello', mediaUrl: '', link: '' });
    expect(formOf(calls[0])).toEqual({ access_token: 'page-token', message: 'Hello' });
  });
});

describe('Instagram', () => {
  it('reads the media with likes and comments, preferring a video’s thumbnail', async () => {
    const calls = fakeFetch([
      [
        /ig-1\/media\?/,
        200,
        {
          data: [
            {
              id: 'm1',
              caption: 'Reel',
              media_url: 'https://ig/video.mp4',
              thumbnail_url: 'https://ig/thumb.jpg',
              permalink: 'https://instagram.com/p/m1',
              timestamp: '2026-09-18T10:00:00+0000',
              like_count: 12,
              comments_count: 3,
            },
            { id: 'm2', media_url: 'https://ig/photo.jpg', timestamp: '2026-09-19T10:00:00+0000' },
          ],
        },
      ],
    ]);
    const posts = await instagram.fetchPosts(IG);
    expect(posts).toEqual([
      {
        externalId: 'm1',
        text: 'Reel',
        mediaUrl: 'https://ig/thumb.jpg',
        permalink: 'https://instagram.com/p/m1',
        publishedAt: new Date('2026-09-18T10:00:00Z'),
        metrics: { likes: 12, comments: 3, shares: 0, views: 0 },
      },
      expect.objectContaining({
        externalId: 'm2',
        text: '',
        mediaUrl: 'https://ig/photo.jpg',
        metrics: { likes: 0, comments: 0, shares: 0, views: 0 },
      }),
    ]);
    expect(calls[0].url).toContain('access_token=page-token');
    expect(calls[0].url).toContain('limit=50');
  });

  it('reads nothing when the reply has no media list', async () => {
    fakeFetch([[/ig-1\/media\?/, 200, {}]]);
    expect(await instagram.fetchPosts(IG)).toEqual([]);
  });

  it('puts the link in the caption of the container it publishes', async () => {
    const calls = fakeFetch([
      [/ig-1\/media_publish/, 200, { id: 'ig-post' }],
      [/ig-1\/media$/, 200, { id: 'container' }],
      [/ig-post\?/, 200, { permalink: 'https://instagram.com/p/x' }],
    ]);
    const published = await instagram.publish?.(IG, {
      text: 'Look',
      mediaUrl: 'https://img/a.png',
      link: 'https://exyconn.com',
    });
    expect(published).toEqual({ externalId: 'ig-post', permalink: 'https://instagram.com/p/x' });
    expect(formOf(calls[0]).caption).toBe('Look\n\nhttps://exyconn.com');
    expect(formOf(calls[1]).creation_id).toBe('container');
  });
});
