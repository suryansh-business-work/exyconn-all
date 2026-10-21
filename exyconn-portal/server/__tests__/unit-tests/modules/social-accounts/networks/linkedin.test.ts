import { linkedin, littleText } from '../../../../../src/modules/social-accounts/networks/linkedin';
import { fakeFetch } from '../social.fixtures';

const MEMBER = { externalId: 'm-1', accessToken: 'li-token' };
const PAGE = { externalId: '42', accessToken: 'li-token', kind: 'ORGANIZATION' as const };
const CREATED = { 'x-restli-id': 'urn:li:share:1' };

afterEach(() => jest.restoreAllMocks());

const bodyOf = (body: string) => JSON.parse(body) as Record<string, unknown>;

describe('LinkedIn publishing', () => {
  it('posts as the member through the versioned Posts API, a link shared as an article', async () => {
    const calls = fakeFetch([[/rest\/posts$/, 201, {}, CREATED]]);
    const published = await linkedin.publish?.(MEMBER, {
      text: 'Read this',
      mediaUrl: '',
      link: 'https://exyconn.com/blog',
    });

    expect(published).toEqual({
      externalId: 'urn:li:share:1',
      permalink: 'https://www.linkedin.com/feed/update/urn:li:share:1',
    });
    expect(calls[0].url).toBe('https://api.linkedin.com/rest/posts');
    expect(calls[0].method).toBe('POST');
    expect(calls[0].headers).toMatchObject({
      Authorization: 'Bearer li-token',
      'LinkedIn-Version': expect.stringMatching(/^\d{6}$/),
      'X-Restli-Protocol-Version': '2.0.0',
    });
    expect(bodyOf(calls[0].body)).toMatchObject({
      author: 'urn:li:person:m-1',
      commentary: 'Read this',
      visibility: 'PUBLIC',
      lifecycleState: 'PUBLISHED',
      content: { article: { source: 'https://exyconn.com/blog', title: 'exyconn.com' } },
    });
  });

  it('posts as the company page when the account is an organization, text alone', async () => {
    const calls = fakeFetch([[/rest\/posts$/, 201, {}, CREATED]]);
    await linkedin.publish?.(PAGE, { text: 'Hiring (two roles) #jobs', mediaUrl: '', link: '' });

    const body = bodyOf(calls[0].body);
    expect(body.author).toBe('urn:li:organization:42');
    // LinkedIn reads these as markup unless escaped.
    expect(body.commentary).toBe(String.raw`Hiring \(two roles\) \#jobs`);
    expect(body).not.toHaveProperty('content');
  });

  it('escapes every reserved little-text character, and nothing else', () => {
    expect(littleText(String.raw`a|b{c}d@e[f]g(h)i<j>k#l\m*n_o~p.`)).toBe(
      String.raw`a\|b\{c\}d\@e\[f\]g\(h\)i\<j\>k\#l\\m\*n\_o\~p.`,
    );
  });

  it('names an article after the link itself when the link is not a URL', async () => {
    const calls = fakeFetch([[/rest\/posts$/, 201, {}, CREATED]]);
    await linkedin.publish?.(MEMBER, { text: 'x', mediaUrl: '', link: 'not a url' });
    expect(bodyOf(calls[0].body).content).toEqual({
      article: { source: 'not a url', title: 'not a url' },
    });
  });
});

describe('LinkedIn reading', () => {
  it('reads nothing back for a member, because LinkedIn does not allow it', async () => {
    expect(await linkedin.fetchPosts(MEMBER)).toBeNull();
  });

  it("reads a page's posts with their share statistics", async () => {
    const calls = fakeFetch([
      [
        /rest\/posts\?q=author/,
        200,
        {
          elements: [
            { id: 'urn:li:share:1', commentary: 'One', publishedAt: 1_758_189_600_000 },
            { id: 'urn:li:ugcPost:2', commentary: 'Two', createdAt: 1_758_276_000_000 },
          ],
        },
      ],
      [
        /organizationalEntityShareStatistics/,
        200,
        {
          elements: [
            {
              share: 'urn:li:share:1',
              totalShareStatistics: {
                likeCount: 5,
                commentCount: 2,
                shareCount: 1,
                impressionCount: 300,
              },
            },
          ],
        },
      ],
    ]);
    const posts = await linkedin.fetchPosts(PAGE);

    expect(posts).toEqual([
      {
        externalId: 'urn:li:share:1',
        text: 'One',
        mediaUrl: '',
        permalink: 'https://www.linkedin.com/feed/update/urn:li:share:1',
        publishedAt: new Date(1_758_189_600_000),
        metrics: { likes: 5, comments: 2, shares: 1, views: 300 },
      },
      expect.objectContaining({
        externalId: 'urn:li:ugcPost:2',
        publishedAt: new Date(1_758_276_000_000),
        metrics: { likes: 0, comments: 0, shares: 0, views: 0 },
      }),
    ]);
    expect(calls[0].url).toContain(`author=${encodeURIComponent('urn:li:organization:42')}`);
    expect(calls[1].url).toContain(`shares=List(${encodeURIComponent('urn:li:share:1')})`);
    expect(calls[1].url).toContain(`ugcPosts=List(${encodeURIComponent('urn:li:ugcPost:2')})`);
  });

  it('keeps the posts with empty numbers when LinkedIn will not share the statistics', async () => {
    fakeFetch([
      [/rest\/posts\?q=author/, 200, { elements: [{ id: 'urn:li:share:9', commentary: 'Hi' }] }],
      [/organizationalEntityShareStatistics/, 403, { message: 'Not enough permissions' }],
    ]);
    const posts = await linkedin.fetchPosts(PAGE);
    expect(posts?.[0].metrics).toEqual({ likes: 0, comments: 0, shares: 0, views: 0 });
  });

  it('asks for no statistics when the page has no posts', async () => {
    const calls = fakeFetch([[/rest\/posts\?q=author/, 200, { elements: [] }]]);
    expect(await linkedin.fetchPosts(PAGE)).toEqual([]);
    expect(calls).toHaveLength(1);
  });
});

describe('LinkedIn deleting', () => {
  it('deletes a post by its encoded URN', async () => {
    const calls = fakeFetch([[/rest\/posts\//, 204, undefined]]);
    await linkedin.remove?.(PAGE, 'urn:li:share:1');
    expect(calls[0].method).toBe('DELETE');
    expect(calls[0].url).toBe(
      `https://api.linkedin.com/rest/posts/${encodeURIComponent('urn:li:share:1')}`,
    );
    expect(calls[0].headers['X-RestLi-Method']).toBe('DELETE');
  });
});
