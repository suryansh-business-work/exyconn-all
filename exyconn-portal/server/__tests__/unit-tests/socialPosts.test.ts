import { Types } from 'mongoose';
import { SocialAccountModel } from '../../src/modules/social-accounts/social.models';
import { SocialMediaPostModel } from '../../src/modules/social-accounts/social-post.model';
import { socialAccountsResolvers, socialPostsResolvers } from '../../src/modules/social-accounts';
import {
  composePosts,
  publishDuePosts,
  publishNow,
  updatePost,
  deletePost,
} from '../../src/modules/social-accounts/social.publish';
import { syncAccount, syncAllAccounts } from '../../src/modules/social-accounts/social.sync';
import { testAppConnection } from '../../src/modules/social-accounts/social.test-connection';
import { ruleProblem } from '../../src/modules/social-accounts/social.rules';
import { open, seal } from '../../src/utils/secretBox';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';
import { OPERATOR_ORGANIZATION_ID, seedPlatformOperator } from './security-authz.operator';

jest.mock('../../src/modules/ai/ai.actions', () => ({
  ...jest.requireActual('../../src/modules/ai/ai.actions'),
  runAssist: jest.fn(async (name: string, prompt: string) => `${name}: ${prompt.length}`),
}));
import { runAssist } from '../../src/modules/ai/ai.actions';

const ORGANIZATION = useTestOrganization();
type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = socialPostsResolvers.Query as unknown as Record<string, Resolver>;
const M = socialPostsResolvers.Mutation as unknown as Record<string, Resolver>;
const AM = socialAccountsResolvers.Mutation as unknown as Record<string, Resolver>;
const ctx = (roles: Role[], organizationId = ORGANIZATION) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'm@exyconn.com', roles, organizationId },
    organizationId,
  }) as unknown as GraphQLContext;
const marketing = () => ctx([ROLES.MARKETING]);
const HOUR = 3_600_000;

/** Answers each provider URL with the JSON a real one would send, in order of the first match. */
function fakeNetwork(routes: Array<[RegExp, number, unknown]>) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    const hit = routes.find(([pattern]) => pattern.test(url));
    const [, status, body] = hit ?? [/./, 400, { error: { message: `unexpected ${url}` } }];
    return new Response(JSON.stringify(body), { status });
  });
}

const account = (network: string, app: string, over: Record<string, unknown> = {}) =>
  SocialAccountModel.create({
    network,
    app,
    externalId: `${network.toLowerCase()}-1`,
    name: network,
    accessToken: seal(`${network}-token`),
    connectedBy: 'u1',
    ...over,
  });

const draft = (over: Record<string, unknown> = {}) => ({
  text: 'Hello',
  mediaUrl: '',
  link: '',
  ...over,
});

afterEach(() => jest.restoreAllMocks());

describe('network rules', () => {
  it('knows what each network takes', () => {
    expect(ruleProblem('INSTAGRAM', draft())).toMatch('needs an image');
    expect(ruleProblem('X', draft({ text: 'x'.repeat(281) }))).toMatch('allows 280');
    expect(
      ruleProblem('X', draft({ text: 'x'.repeat(265), link: 'https://exyconn.com/a' })),
    ).toMatch('allows 280');
    expect(ruleProblem('X', draft({ mediaUrl: 'https://i/a.png' }))).toMatch(
      'cannot carry an image',
    );
    expect(ruleProblem('YOUTUBE', draft())).toMatch('does not take posts');
    expect(ruleProblem('FACEBOOK', draft({ text: ' ' }))).toMatch('Write something');
    expect(ruleProblem('FACEBOOK', draft({ mediaUrl: 'https://i/a.png' }))).toBeNull();
  });
});

describe('test connection', () => {
  beforeEach(async () => {
    await seedPlatformOperator();
    await AM.saveSocialAppConfig(
      null,
      {
        input: {
          app: 'YOUTUBE',
          clientId: 'id',
          clientSecret: 'secret-0123456789abcdef',
          enabled: true,
        },
      },
      ctx([ROLES.TECH], OPERATOR_ORGANIZATION_ID),
    );
  });

  it('passes when the provider only refuses the made-up code', async () => {
    fakeNetwork([
      [/oauth2\.googleapis/, 400, { error: 'invalid_grant', error_description: 'Bad Request' }],
    ]);
    expect(await testAppConnection('YOUTUBE')).toMatchObject({ ok: true });
  });

  it('fails when the provider refuses the client', async () => {
    fakeNetwork([
      [
        /oauth2\.googleapis/,
        401,
        { error: 'invalid_client', error_description: 'The OAuth client was not found.' },
      ],
    ]);
    expect(await testAppConnection('YOUTUBE')).toMatchObject({ ok: false });
  });

  it('says what is missing, and when the provider cannot be reached', async () => {
    expect(await testAppConnection('X')).toMatchObject({
      ok: false,
      message: expect.stringMatching('Add the X'),
    });
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ENOTFOUND'));
    expect(await testAppConnection('YOUTUBE')).toMatchObject({
      ok: false,
      message: expect.stringMatching('could not be reached'),
    });
  });
});

describe('composing and publishing', () => {
  it('refuses a draft any chosen network would refuse, before creating anything', async () => {
    const ig = await account('INSTAGRAM', 'META');
    await expect(composePosts({ ...draft(), accountIds: [String(ig._id)] }, 'u1')).rejects.toThrow(
      'needs an image',
    );
    await expect(composePosts({ ...draft(), accountIds: [] }, 'u1')).rejects.toThrow(
      'at least one account',
    );
    await expect(
      composePosts({ ...draft(), accountIds: [new Types.ObjectId().toHexString()] }, 'u1'),
    ).rejects.toThrow();
    await expect(
      composePosts(
        {
          ...draft(),
          accountIds: [String((await account('FACEBOOK', 'META'))._id)],
          scheduledAt: new Date(Date.now() - HOUR),
        },
        'u1',
      ),
    ).rejects.toThrow('in the future');
    expect(await SocialMediaPostModel.countDocuments()).toBe(0);
  });

  it('publishes now to each account, recording what each network said', async () => {
    const fb = await account('FACEBOOK', 'META');
    const li = await account('LINKEDIN', 'LINKEDIN');
    fakeNetwork([
      [/facebook\.com\/v19\.0\/facebook-1\/feed/, 200, { id: 'fb-post-1' }],
      [/ugcPosts/, 403, { message: 'Not enough permissions' }],
    ]);
    const posts = (await composePosts(
      { ...draft({ link: 'https://exyconn.com' }), accountIds: [String(fb._id), String(li._id)] },
      'u1',
    )) as Array<Record<string, unknown>>;
    const byNetwork = Object.fromEntries(posts.map((p) => [p.network, p]));
    expect(byNetwork.FACEBOOK).toMatchObject({
      status: 'PUBLISHED',
      externalId: 'fb-post-1',
      permalink: 'https://www.facebook.com/fb-post-1',
    });
    expect(byNetwork.LINKEDIN).toMatchObject({
      status: 'FAILED',
      error: expect.stringMatching('Not enough permissions'),
    });
    expect(new Set(posts.map((p) => p.batchId)).size).toBe(1);
  });

  it('publishes Instagram in two steps, with the permalink Instagram gives', async () => {
    const ig = await account('INSTAGRAM', 'META');
    fakeNetwork([
      [/instagram-1\/media_publish/, 200, { id: 'ig-media-1' }],
      [/instagram-1\/media\?|instagram-1\/media$/, 200, { id: 'container-1' }],
      [/ig-media-1\?/, 200, { permalink: 'https://instagram.com/p/abc' }],
    ]);
    const [post] = (await composePosts(
      { ...draft({ mediaUrl: 'https://i/a.png' }), accountIds: [String(ig._id)] },
      'u1',
    )) as Array<Record<string, unknown>>;
    expect(post).toMatchObject({ status: 'PUBLISHED', permalink: 'https://instagram.com/p/abc' });
  });

  it('schedules, keeps drafts, and publishes a due post once', async () => {
    const xAcc = await account('X', 'X');
    const later = new Date(Date.now() + HOUR);
    const [scheduled] = (await composePosts(
      { ...draft(), accountIds: [String(xAcc._id)], scheduledAt: later },
      'u1',
    )) as Array<{ _id: unknown; status: string }>;
    const [kept] = (await composePosts(
      { ...draft(), accountIds: [String(xAcc._id)], draft: true },
      'u1',
    )) as Array<{ _id: unknown; status: string }>;
    expect([scheduled.status, kept.status]).toEqual(['SCHEDULED', 'DRAFT']);

    const tweeted = fakeNetwork([[/api\.x\.com\/2\/tweets/, 201, { data: { id: 't-1' } }]]);
    expect(await publishDuePosts(new Date())).toBe(0);
    expect(await publishDuePosts(new Date(Date.now() + 2 * HOUR))).toBe(1);
    expect(await publishDuePosts(new Date(Date.now() + 2 * HOUR))).toBe(0);
    expect(tweeted).toHaveBeenCalledTimes(1);
    expect(await SocialMediaPostModel.findById(scheduled._id).lean()).toMatchObject({
      status: 'PUBLISHED',
      externalId: 't-1',
    });
  });

  it('edits, publishes and deletes only posts that have not gone out', async () => {
    const xAcc = await account('X', 'X');
    const [kept] = (await composePosts(
      { ...draft(), accountIds: [String(xAcc._id)], draft: true },
      'u1',
    )) as Array<{ _id: unknown }>;
    const id = String(kept._id);
    const later = new Date(Date.now() + HOUR);
    expect(
      await updatePost(id, { ...draft({ text: 'Edited' }), scheduledAt: later }),
    ).toMatchObject({ text: 'Edited', status: 'SCHEDULED' });
    expect(await updatePost(id, { ...draft({ text: 'Back' }), scheduledAt: null })).toMatchObject({
      status: 'DRAFT',
    });
    await expect(updatePost(id, { ...draft({ text: 'x'.repeat(300) }) })).rejects.toThrow(
      'allows 280',
    );
    await expect(
      updatePost(id, { ...draft(), scheduledAt: new Date(Date.now() - HOUR) }),
    ).rejects.toThrow('in the future');
    fakeNetwork([[/api\.x\.com\/2\/tweets/, 201, { data: { id: 't-2' } }]]);
    expect(await publishNow(id)).toMatchObject({ status: 'PUBLISHED' });
    await expect(deletePost(id)).rejects.toThrow('Only a draft');
    await expect(updatePost(new Types.ObjectId().toHexString(), draft())).rejects.toThrow();
    const [other] = (await composePosts(
      { ...draft(), accountIds: [String(xAcc._id)], draft: true },
      'u1',
    )) as Array<{ _id: unknown }>;
    expect(await deletePost(String(other._id))).toBe(true);
  });

  it('fails a post whose account was disconnected, and one for a network that takes none', async () => {
    const fb = await account('FACEBOOK', 'META');
    const later = new Date(Date.now() + HOUR);
    const [post] = (await composePosts(
      { ...draft(), accountIds: [String(fb._id)], scheduledAt: later },
      'u1',
    )) as Array<{ _id: unknown }>;
    await SocialAccountModel.deleteOne({ _id: fb._id });
    await publishDuePosts(new Date(Date.now() + 2 * HOUR));
    expect(await SocialMediaPostModel.findById(post._id).lean()).toMatchObject({
      status: 'FAILED',
      error: expect.stringMatching('disconnected'),
    });

    const yt = await account('YOUTUBE', 'YOUTUBE');
    const ytPost = await SocialMediaPostModel.create({
      accountId: String(yt._id),
      network: 'YOUTUBE',
      app: 'YOUTUBE',
      origin: 'COMPOSED',
      status: 'DRAFT',
      text: 'Hi',
    });
    expect(await publishNow(String(ytPost._id))).toMatchObject({
      status: 'FAILED',
      error: expect.stringMatching('does not take posts'),
    });
  });
});

describe('syncing', () => {
  it("files an account's posts with their numbers, and matches a post published from here", async () => {
    const fb = await account('FACEBOOK', 'META');
    await SocialMediaPostModel.create({
      accountId: String(fb._id),
      network: 'FACEBOOK',
      app: 'META',
      origin: 'COMPOSED',
      status: 'PUBLISHED',
      externalId: 'p2',
      text: 'Ours',
    });
    const posts = [
      {
        id: 'p1',
        message: 'Hi',
        created_time: '2026-09-18T10:00:00+0000',
        permalink_url: 'https://fb/p1',
        reactions: { summary: { total_count: 5 } },
        comments: { summary: { total_count: 2 } },
        shares: { count: 1 },
      },
      {
        id: 'p2',
        message: 'Ours',
        created_time: '2026-09-19T10:00:00+0000',
        permalink_url: 'https://fb/p2',
        reactions: { summary: { total_count: 9 } },
      },
    ];
    fakeNetwork([[/facebook-1\/posts/, 200, { data: posts }]]);
    expect(await syncAccount(String(fb._id))).toMatchObject({ synced: 2, error: '' });
    expect(await SocialMediaPostModel.countDocuments()).toBe(2);
    expect(await SocialMediaPostModel.findOne({ externalId: 'p1' }).lean()).toMatchObject({
      origin: 'SYNCED',
      metrics: { likes: 5, comments: 2, shares: 1 },
    });
    expect(await SocialMediaPostModel.findOne({ externalId: 'p2' }).lean()).toMatchObject({
      origin: 'COMPOSED',
      metrics: { likes: 9 },
    });
  });

  it('records a refusal on the account, and reads nothing where the network allows none', async () => {
    const xAcc = await account('X', 'X');
    const li = await account('LINKEDIN', 'LINKEDIN');
    fakeNetwork([
      [
        /users\/x-1\/tweets/,
        403,
        { title: 'Forbidden', detail: 'Your plan does not include this endpoint' },
      ],
    ]);
    const results = await syncAllAccounts();
    expect(results.find((r) => r.accountId === String(xAcc._id))?.error).toMatch('X refused');
    expect(results.find((r) => r.accountId === String(li._id))).toMatchObject({
      synced: 0,
      error: '',
    });
    expect((await SocialAccountModel.findById(xAcc._id).lean())?.syncError).toMatch('X refused');
    expect(await syncAccount(new Types.ObjectId().toHexString())).toMatchObject({
      error: expect.stringMatching('no longer connected'),
    });
  });

  it('refreshes an expired token before reading, and keeps the new one', async () => {
    await seedPlatformOperator();
    await AM.saveSocialAppConfig(
      null,
      {
        input: {
          app: 'YOUTUBE',
          clientId: 'id',
          clientSecret: 'secret-0123456789abcdef',
          enabled: true,
        },
      },
      ctx([ROLES.TECH], OPERATOR_ORGANIZATION_ID),
    );
    const yt = await account('YOUTUBE', 'YOUTUBE', {
      expiresAt: new Date(Date.now() - HOUR),
      refreshToken: seal('refresh-1'),
    });
    fakeNetwork([
      [/oauth2\.googleapis\.com\/token/, 200, { access_token: 'fresh', expires_in: 3600 }],
      [
        /channels\?/,
        200,
        { items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU1' } } }] },
      ],
      [/playlistItems/, 200, { items: [{ contentDetails: { videoId: 'v1' } }] }],
      [
        /videos\?/,
        200,
        {
          items: [
            {
              id: 'v1',
              snippet: { title: 'Demo', publishedAt: '2026-09-18T00:00:00Z' },
              statistics: { viewCount: '120', likeCount: '7', commentCount: '1' },
            },
          ],
        },
      ],
    ]);
    expect(await syncAccount(String(yt._id))).toMatchObject({ synced: 1 });
    const stored = await SocialAccountModel.findById(yt._id).lean();
    expect(open(String(stored?.accessToken))).toBe('fresh');
    expect(await SocialMediaPostModel.findOne({ externalId: 'v1' }).lean()).toMatchObject({
      metrics: { views: 120, likes: 7 },
    });
  });

  it('asks for a reconnect when a token expired and cannot be refreshed', async () => {
    const fb = await account('FACEBOOK', 'META', { expiresAt: new Date(Date.now() - HOUR) });
    expect(await syncAccount(String(fb._id))).toMatchObject({
      error: expect.stringMatching('connect the account again'),
    });
  });
});

describe('analytics and AI', () => {
  beforeEach(async () => {
    const fb = await account('FACEBOOK', 'META');
    const recent = new Date(Date.now() - HOUR);
    await SocialMediaPostModel.create([
      {
        accountId: String(fb._id),
        network: 'FACEBOOK',
        app: 'META',
        origin: 'SYNCED',
        status: 'PUBLISHED',
        externalId: 'a',
        text: 'Great launch',
        publishedAt: recent,
        metrics: { likes: 10, comments: 3, shares: 2, views: 100 },
      },
      {
        accountId: String(fb._id),
        network: 'FACEBOOK',
        app: 'META',
        origin: 'SYNCED',
        status: 'PUBLISHED',
        externalId: 'b',
        text: 'Quiet day',
        publishedAt: recent,
        metrics: { likes: 1 },
      },
      {
        accountId: String(fb._id),
        network: 'FACEBOOK',
        app: 'META',
        origin: 'COMPOSED',
        status: 'SCHEDULED',
        text: 'Soon',
        scheduledAt: new Date(Date.now() + HOUR),
      },
    ]);
  });

  it('adds up engagement, per network, per day, best first', async () => {
    const report = (await Q.socialAnalytics(null, { days: 7 }, marketing())) as Record<
      string,
      unknown
    > & {
      topPosts: Array<{ text: string }>;
      engagementPerDay: Array<{ value: number }>;
    };
    expect(report).toMatchObject({
      posts: 2,
      likes: 11,
      engagement: 16,
      views: 100,
      scheduled: 1,
      failed: 0,
      byNetwork: [{ network: 'FACEBOOK', posts: 2, engagement: 16 }],
    });
    expect(report.topPosts.map((post) => post.text)).toEqual(['Great launch', 'Quiet day']);
    expect(report.engagementPerDay).toHaveLength(7);
    await expect(Q.socialAnalytics(null, { days: 0 }, marketing())).rejects.toThrow(
      'between 1 and 365',
    );
  });

  it('lists posts, and the calendar within a sane range', async () => {
    expect(((await Q.socialMediaPosts(null, { limit: 10 }, marketing())) as unknown[]).length).toBe(
      3,
    );
    expect(
      (
        (await Q.socialMediaPosts(
          null,
          { status: 'SCHEDULED', limit: 10 },
          marketing(),
        )) as unknown[]
      ).length,
    ).toBe(1);
    const from = new Date(Date.now() - 24 * HOUR);
    const to = new Date(Date.now() + 24 * HOUR);
    expect(((await Q.socialCalendar(null, { from, to }, marketing())) as unknown[]).length).toBe(3);
    await expect(Q.socialCalendar(null, { from: to, to: from }, marketing())).rejects.toThrow(
      'range',
    );
    expect(((await Q.socialNetworkRules(null, {}, marketing())) as unknown[]).length).toBe(5);
  });

  it('asks the AI with the posts, and refuses a bad request', async () => {
    expect(await M.socialMediaInsights(null, { days: 30 }, marketing())).toMatch(
      'Analyse social posts',
    );
    expect(
      await M.socialMediaIdeas(null, { topic: 'AI for small shops', count: 3 }, marketing()),
    ).toMatch('Social post ideas');
    const prompt = (runAssist as jest.Mock).mock.calls[0][1] as string;
    expect(prompt).toContain('Great launch');
    await expect(M.socialMediaIdeas(null, { topic: ' ', count: 3 }, marketing())).rejects.toThrow(
      'about',
    );
    await expect(M.socialMediaIdeas(null, { topic: 'x', count: 50 }, marketing())).rejects.toThrow(
      'between 1 and 10',
    );
    await SocialMediaPostModel.deleteMany({});
    await expect(M.socialMediaInsights(null, { days: 30 }, marketing())).rejects.toThrow(
      'no published posts',
    );
  });

  it('is for Marketing only', async () => {
    await expect(Q.socialMediaPosts(null, { limit: 5 }, ctx([ROLES.EMPLOYEE]))).rejects.toThrow();
  });
});
