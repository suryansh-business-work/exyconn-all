import { x } from '../../../../../src/modules/social-accounts/networks/x';
import { linkedin } from '../../../../../src/modules/social-accounts/networks/linkedin';
import { fakeFetch } from '../social.fixtures';

const X_ACCOUNT = { externalId: 'x-1', accessToken: 'x-token' };
const MEMBER = { externalId: 'm-1', accessToken: 'li-token' };

afterEach(() => jest.restoreAllMocks());

describe('X reading', () => {
  it('reads tweets with likes, replies, reposts plus quotes, and impressions', async () => {
    const calls = fakeFetch([
      [
        /users\/x-1\/tweets/,
        200,
        {
          data: [
            {
              id: 't1',
              text: 'Hello',
              created_at: '2026-09-18T10:00:00.000Z',
              public_metrics: {
                like_count: 4,
                reply_count: 2,
                retweet_count: 1,
                quote_count: 3,
                impression_count: 500,
              },
            },
            { id: 't2', created_at: '2026-09-19T10:00:00.000Z' },
          ],
        },
      ],
    ]);
    const posts = await x.fetchPosts(X_ACCOUNT);
    expect(posts).toEqual([
      {
        externalId: 't1',
        text: 'Hello',
        mediaUrl: '',
        permalink: 'https://x.com/i/web/status/t1',
        publishedAt: new Date('2026-09-18T10:00:00.000Z'),
        metrics: { likes: 4, comments: 2, shares: 4, views: 500 },
      },
      expect.objectContaining({
        externalId: 't2',
        text: '',
        metrics: { likes: 0, comments: 0, shares: 0, views: 0 },
      }),
    ]);
    expect(calls[0].url).toContain('max_results=50');
    expect(calls[0].headers.Authorization).toBe('Bearer x-token');
  });
});

describe('X publishing', () => {
  it('adds the link to the tweet text once', async () => {
    const fetched = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(
        async () => new Response(JSON.stringify({ data: { id: 't9' } }), { status: 201 }),
      );
    const published = await x.publish?.(X_ACCOUNT, {
      text: 'Read https://exyconn.com',
      mediaUrl: '',
      link: 'https://exyconn.com',
    });
    expect(published).toEqual({ externalId: 't9', permalink: 'https://x.com/i/web/status/t9' });
    expect(JSON.parse(String(fetched.mock.calls[0][1]?.body))).toEqual({
      text: 'Read https://exyconn.com',
    });
  });
});

describe('LinkedIn publishing', () => {
  const bodyOf = (fetched: jest.SpiedFunction<typeof fetch>) =>
    JSON.parse(String(fetched.mock.calls[0][1]?.body)) as {
      author: string;
      specificContent: Record<string, Record<string, unknown>>;
    };
  const reply = (body: unknown) =>
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(JSON.stringify(body), { status: 201 }));

  it('shares a link as an article and links to the update', async () => {
    const fetched = reply({ id: 'urn:li:share:1' });
    const published = await linkedin.publish?.(MEMBER, {
      text: 'Read this',
      mediaUrl: '',
      link: 'https://exyconn.com',
    });
    expect(published).toEqual({
      externalId: 'urn:li:share:1',
      permalink: 'https://www.linkedin.com/feed/update/urn:li:share:1',
    });
    const body = bodyOf(fetched);
    expect(body.author).toBe('urn:li:person:m-1');
    expect(body.specificContent['com.linkedin.ugc.ShareContent']).toEqual({
      shareCommentary: { text: 'Read this' },
      shareMediaCategory: 'ARTICLE',
      media: [{ status: 'READY', originalUrl: 'https://exyconn.com' }],
    });
  });

  it('posts text alone with no media', async () => {
    const fetched = reply({ id: 'urn:li:share:2' });
    await linkedin.publish?.(MEMBER, { text: 'Just words', mediaUrl: '', link: '' });
    expect(bodyOf(fetched).specificContent['com.linkedin.ugc.ShareContent']).toEqual({
      shareCommentary: { text: 'Just words' },
      shareMediaCategory: 'NONE',
    });
  });

  it('reads nothing back, because LinkedIn does not allow it', async () => {
    expect(await linkedin.fetchPosts(MEMBER)).toBeNull();
  });
});
