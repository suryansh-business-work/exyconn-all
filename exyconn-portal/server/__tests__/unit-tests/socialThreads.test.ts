import { Types } from 'mongoose';
import { PROVIDERS } from '../../src/modules/social-accounts/social.providers';
import { CONTAINER_WAIT, threads } from '../../src/modules/social-accounts/networks/threads';
import { SocialAccountModel } from '../../src/modules/social-accounts/social.models';
import { SocialMediaPostModel } from '../../src/modules/social-accounts/social-post.model';
import { socialAccountsResolvers, socialPostsResolvers } from '../../src/modules/social-accounts';
import { syncAccount } from '../../src/modules/social-accounts/social.sync';
import { ruleProblem } from '../../src/modules/social-accounts/social.rules';
import { open, seal } from '../../src/utils/secretBox';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';
import { OPERATOR_ORGANIZATION_ID, seedPlatformOperator } from './security-authz.operator';

const ORGANIZATION = useTestOrganization();
type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = socialPostsResolvers.Query as unknown as Record<string, Resolver>;
const AM = socialAccountsResolvers.Mutation as unknown as Record<string, Resolver>;
const AQ = socialAccountsResolvers.Query as unknown as Record<string, Resolver>;
const ctx = (roles: Role[], organizationId = ORGANIZATION) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'm@exyconn.com', roles, organizationId },
    organizationId,
  }) as unknown as GraphQLContext;
const HOUR = 3_600_000;
const APP = { clientId: 'threads-app', clientSecret: 'threads-secret-0123456789' };
const ACCOUNT = { externalId: 'th-1', accessToken: 'th-token' };

interface Call {
  url: string;
  method: string;
  body: string;
}

/** Answers each Threads URL with the JSON the API would send, and records every call. */
function fakeThreads(routes: Array<[RegExp, unknown]>, calls: Call[] = []) {
  // A route answering with a list gives its answers in turn, the last one from then on.
  const turns = new Map<RegExp, number>();
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    calls.push({ url, method: init?.method ?? 'GET', body: String(init?.body ?? '') });
    const hit = routes.find(([pattern]) => pattern.test(url));
    const status = hit ? 200 : 400;
    let body: unknown = { error: { message: `unexpected ${url}` } };
    if (hit && Array.isArray(hit[1])) {
      const turn = turns.get(hit[0]) ?? 0;
      turns.set(hit[0], turn + 1);
      body = hit[1][Math.min(turn, hit[1].length - 1)];
    } else if (hit) {
      body = hit[1];
    }
    return new Response(JSON.stringify(body), { status });
  });
  return calls;
}

const insight = (name: string, value: number) => ({ name, values: [{ value }] });

beforeAll(() => {
  CONTAINER_WAIT.intervalMs = 0;
  CONTAINER_WAIT.attempts = 3;
});
afterEach(() => jest.restoreAllMocks());

describe('Threads provider', () => {
  it('asks for consent on threads.net with the publishing scopes', () => {
    const consent = new URL(
      PROVIDERS.THREADS.authorizeUrl(APP, 'https://api/cb', 'state-1', 'challenge'),
    );
    expect(consent.origin + consent.pathname).toBe('https://threads.net/oauth/authorize');
    expect(Object.fromEntries(consent.searchParams)).toEqual({
      client_id: 'threads-app',
      redirect_uri: 'https://api/cb',
      scope: 'threads_basic,threads_content_publish,threads_manage_insights',
      response_type: 'code',
      state: 'state-1',
    });
  });

  it('swaps the code for a short token, then for a 60-day one', async () => {
    const calls = fakeThreads([
      [/oauth\/access_token/, { access_token: 'short', user_id: 'th-1' }],
      [/th_exchange_token/, { access_token: 'long', expires_in: 5_183_944 }],
    ]);
    const tokens = await PROVIDERS.THREADS.exchange(APP, 'the-code', 'https://api/cb', 'v');
    expect(tokens).toEqual({ accessToken: 'long', refreshToken: '', expiresInSeconds: 5_183_944 });
    expect(calls[0]).toMatchObject({
      method: 'POST',
      url: 'https://graph.threads.net/oauth/access_token',
    });
    expect(Object.fromEntries(new URLSearchParams(calls[0].body))).toMatchObject({
      grant_type: 'authorization_code',
      code: 'the-code',
      redirect_uri: 'https://api/cb',
      client_id: 'threads-app',
    });
    expect(calls[1].url).toContain('graph.threads.net/access_token?grant_type=th_exchange_token');
    expect(calls[1].url).toContain('access_token=short');
  });

  it('reads the profile the login reaches', async () => {
    fakeThreads([
      [
        /v1\.0\/me\?/,
        {
          id: 'th-1',
          username: 'exyconn',
          name: 'Exyconn',
          threads_profile_picture_url: 'https://img/a.png',
        },
      ],
    ]);
    const tokens = { accessToken: 'long', refreshToken: '', expiresInSeconds: 1 };
    expect(await PROVIDERS.THREADS.accounts(tokens, APP)).toEqual([
      {
        network: 'THREADS',
        externalId: 'th-1',
        name: 'Exyconn',
        handle: '@exyconn',
        avatarUrl: 'https://img/a.png',
      },
    ]);
  });

  it('names a profile without a display name by its username', async () => {
    fakeThreads([[/v1\.0\/me\?/, { id: 'th-2', username: 'solo' }]]);
    const [account] = await PROVIDERS.THREADS.accounts(
      { accessToken: 'long', refreshToken: '', expiresInSeconds: 1 },
      APP,
    );
    expect(account).toMatchObject({ name: 'solo', handle: '@solo', avatarUrl: '' });
  });
});

describe('Threads network client', () => {
  it('publishes a text post with its link, in two steps, and reads its permalink', async () => {
    const calls = fakeThreads([
      [/th-1\/threads_publish/, { id: 'post-1' }],
      [/th-1\/threads$/, { id: 'container-1' }],
      [/post-1\?fields=permalink/, { permalink: 'https://www.threads.net/@exyconn/post/1' }],
    ]);
    const published = await threads.publish?.(ACCOUNT, {
      text: 'Hello',
      mediaUrl: '',
      link: 'https://exyconn.com',
    });
    expect(published).toEqual({
      externalId: 'post-1',
      permalink: 'https://www.threads.net/@exyconn/post/1',
    });
    expect(Object.fromEntries(new URLSearchParams(calls[0].body))).toEqual({
      access_token: 'th-token',
      media_type: 'TEXT',
      text: 'Hello\n\nhttps://exyconn.com',
    });
    expect(Object.fromEntries(new URLSearchParams(calls[1].body))).toEqual({
      access_token: 'th-token',
      creation_id: 'container-1',
    });
  });

  it('publishes an image post once Threads has processed the image', async () => {
    const calls = fakeThreads([
      [/threads_publish/, { id: 'post-2' }],
      [/th-1\/threads$/, { id: 'container-2' }],
      [/container-2\?fields=status/, [{ status: 'IN_PROGRESS' }, { status: 'FINISHED' }]],
      [/post-2\?/, { permalink: 'https://threads/p2' }],
    ]);
    await threads.publish?.(ACCOUNT, { text: 'Look', mediaUrl: 'https://img/b.png', link: '' });
    expect(Object.fromEntries(new URLSearchParams(calls[0].body))).toMatchObject({
      media_type: 'IMAGE',
      image_url: 'https://img/b.png',
      text: 'Look',
    });
    expect(calls.map((call) => call.url.split('?')[0].split('/').pop())).toEqual([
      'threads',
      'container-2',
      'container-2',
      'threads_publish',
      'post-2',
    ]);
  });

  it('refuses an image Threads could not process, in its words', async () => {
    fakeThreads([
      [/th-1\/threads$/, { id: 'c3' }],
      [/c3\?fields=status/, { status: 'ERROR', error_message: 'Image too small' }],
    ]);
    const image = { text: 'Look', mediaUrl: 'https://img/b.png', link: '' };
    await expect(threads.publish?.(ACCOUNT, image)).rejects.toThrow('Image too small');
  });

  it('refuses an expired container, and gives up when the image never gets ready', async () => {
    const image = { text: 'Look', mediaUrl: 'https://img/b.png', link: '' };
    fakeThreads([
      [/th-1\/threads$/, { id: 'c4' }],
      [/c4\?fields=status/, { status: 'EXPIRED' }],
    ]);
    await expect(threads.publish?.(ACCOUNT, image)).rejects.toThrow('container is expired');
    jest.restoreAllMocks();
    const calls = fakeThreads([
      [/th-1\/threads$/, { id: 'c5' }],
      [/c5\?fields=status/, { status: 'IN_PROGRESS' }],
    ]);
    await expect(threads.publish?.(ACCOUNT, image)).rejects.toThrow('not ready in time');
    expect(calls.filter((call) => call.url.includes('fields=status'))).toHaveLength(3);
  });

  it('reads the recent posts with their likes, replies, reposts and views', async () => {
    const calls = fakeThreads([
      [
        /th-1\/threads\?/,
        {
          data: [
            {
              id: 't1',
              text: 'First',
              media_url: 'https://img/t1.png',
              permalink: 'https://threads/t1',
              timestamp: '2026-09-18T10:00:00+0000',
            },
            { id: 't2', timestamp: '2026-09-19T10:00:00+0000' },
          ],
        },
      ],
      [
        /t1\/insights/,
        {
          data: [
            insight('likes', 5),
            insight('replies', 2),
            insight('reposts', 1),
            insight('views', 90),
          ],
        },
      ],
      [/t2\/insights/, { data: [{ name: 'likes', values: [] }] }],
    ]);
    const posts = await threads.fetchPosts(ACCOUNT);
    expect(posts).toEqual([
      {
        externalId: 't1',
        text: 'First',
        mediaUrl: 'https://img/t1.png',
        permalink: 'https://threads/t1',
        publishedAt: new Date('2026-09-18T10:00:00Z'),
        metrics: { likes: 5, comments: 2, shares: 1, views: 90 },
      },
      expect.objectContaining({
        externalId: 't2',
        text: '',
        metrics: { likes: 0, comments: 0, shares: 0, views: 0 },
      }),
    ]);
    expect(calls[0].url).toContain('fields=id%2Ctext%2Cmedia_url%2Cpermalink%2Ctimestamp');
    expect(calls[0].url).toContain('limit=50');
    expect(calls[1].url).toContain('metric=likes%2Creplies%2Creposts%2Cviews');
  });

  it('takes text up to 500 characters, with or without an image', () => {
    const draft = { text: 'x'.repeat(500), mediaUrl: 'https://img/a.png', link: '' };
    expect(ruleProblem('THREADS', draft)).toBeNull();
    expect(ruleProblem('THREADS', { ...draft, text: 'x'.repeat(501) })).toMatch('allows 500');
  });
});

describe('Threads connections', () => {
  beforeEach(async () => {
    await seedPlatformOperator();
    await AM.saveSocialAppConfig(
      null,
      { input: { app: 'THREADS', ...APP, enabled: true } },
      ctx([ROLES.TECH], OPERATOR_ORGANIZATION_ID),
    );
  });

  it('is offered to Marketing as a Threads profile', async () => {
    const rows = (await AQ.socialAppStatuses(null, {}, ctx([ROLES.MARKETING]))) as {
      app: string;
      networks: string[];
      available: boolean;
    }[];
    expect(rows.find((row) => row.app === 'THREADS')).toMatchObject({
      available: true,
      networks: ['THREADS'],
    });
  });

  it('refreshes an expiring token with the token itself, and keeps the new one', async () => {
    const account = await SocialAccountModel.create({
      network: 'THREADS',
      app: 'THREADS',
      externalId: 'th-1',
      name: 'Exyconn',
      accessToken: seal('old-token'),
      refreshToken: '',
      expiresAt: new Date(Date.now() - HOUR),
      connectedBy: 'u1',
    });
    const calls = fakeThreads([
      [/refresh_access_token/, { access_token: 'new-token', expires_in: 5_184_000 }],
      [/th-1\/threads\?/, { data: [] }],
    ]);
    expect(await syncAccount(String(account._id))).toMatchObject({ synced: 0, error: '' });
    expect(calls[0].url).toBe(
      'https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=old-token',
    );
    expect(calls[1].url).toContain('access_token=new-token');
    const stored = await SocialAccountModel.findById(account._id).lean();
    expect(open(String(stored?.accessToken))).toBe('new-token');
    expect(stored?.expiresAt?.getTime()).toBeGreaterThan(Date.now() + 59 * 24 * HOUR);
  });
});

describe('the calendar, for some accounts', () => {
  it('shows only the chosen accounts’ posts, and every post when none is chosen', async () => {
    const at = new Date(Date.now() + HOUR);
    const base = { app: 'X', network: 'X', origin: 'COMPOSED', status: 'SCHEDULED', text: 'Hi' };
    await SocialMediaPostModel.create([
      { ...base, accountId: 'a1', scheduledAt: at },
      { ...base, accountId: 'a2', scheduledAt: at },
    ]);
    const range = { from: new Date(Date.now() - HOUR), to: new Date(Date.now() + 2 * HOUR) };
    const calendar = async (accountIds?: string[] | null) =>
      (
        (await Q.socialCalendar(null, { ...range, accountIds }, ctx([ROLES.MARKETING]))) as {
          accountId: string;
        }[]
      ).map((post) => post.accountId);
    expect(await calendar(['a2'])).toEqual(['a2']);
    expect(await calendar([])).toEqual(expect.arrayContaining(['a1', 'a2']));
    expect(await calendar(null)).toHaveLength(2);
  });
});
