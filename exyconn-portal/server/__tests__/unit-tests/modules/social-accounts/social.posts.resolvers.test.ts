import { Types } from 'mongoose';
import { socialPostsResolvers } from '../../../../src/modules/social-accounts';
import { SocialMediaPostModel } from '../../../../src/modules/social-accounts/social-post.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import {
  HOUR,
  composedPost,
  connectAccount,
  ctxOf,
  fakeFetch,
  type Resolver,
} from './social.fixtures';

const ORGANIZATION = useTestOrganization();
const Q = socialPostsResolvers.Query as unknown as Record<string, Resolver>;
const M = socialPostsResolvers.Mutation as unknown as Record<string, Resolver>;
const marketing = () => ctxOf([ROLES.MARKETING], ORGANIZATION);
const employee = () => ctxOf([ROLES.EMPLOYEE], ORGANIZATION);
const DAY = 24 * HOUR;

afterEach(() => jest.restoreAllMocks());

describe('reading posts', () => {
  it('lists one account’s posts, at least one even when asked for none', async () => {
    await composedPost('a1');
    await composedPost('a1', { text: 'Second' });
    await composedPost('a2');
    const rows = (await Q.socialMediaPosts(null, { accountId: 'a1', limit: 0 }, marketing())) as {
      id: string;
      accountId: string;
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].accountId).toBe('a1');
    expect(typeof rows[0].id).toBe('string');
  });

  it('refuses a calendar longer than two months', async () => {
    const from = new Date();
    const to = new Date(from.getTime() + 63 * DAY);
    await expect(Q.socialCalendar(null, { from, to }, marketing())).rejects.toThrow(
      'Ask for a range of up to 62 days',
    );
  });

  it('refuses a period that is not a whole number of days', async () => {
    await expect(Q.socialAnalytics(null, { days: 1.5 }, marketing())).rejects.toThrow(
      'between 1 and 365',
    );
    await expect(M.socialMediaInsights(null, { days: 400 }, marketing())).rejects.toThrow(
      'between 1 and 365',
    );
  });

  it('reports a quiet period as zeros rather than failing', async () => {
    const report = (await Q.socialAnalytics(null, { days: 3 }, marketing())) as Record<
      string,
      unknown
    > & { engagementPerDay: Array<{ value: number }> };
    expect(report).toMatchObject({
      days: 3,
      posts: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      engagement: 0,
      scheduled: 0,
      failed: 0,
      byNetwork: [],
      topPosts: [],
    });
    expect(report.engagementPerDay.map((point) => point.value)).toEqual([0, 0, 0]);
  });
});

describe('changing posts through the API', () => {
  it('composes, edits, publishes and deletes as the signed-in marketer', async () => {
    const account = await connectAccount('X', 'X');
    const ctx = marketing();
    const [kept] = (await M.composeSocialMediaPost(
      null,
      {
        input: {
          text: 'Hi',
          mediaUrl: '',
          link: '',
          accountIds: [account._id.toHexString()],
          draft: true,
        },
      },
      ctx,
    )) as { id: string; createdBy: string; status: string }[];
    expect(kept).toMatchObject({ status: 'DRAFT', createdBy: ctx.user?.id });

    const edited = (await M.updateSocialMediaPost(
      null,
      { id: kept.id, input: { text: 'Edited', mediaUrl: '', link: '' } },
      ctx,
    )) as { id: string; text: string };
    expect(edited).toMatchObject({ id: kept.id, text: 'Edited' });

    fakeFetch([[/api\.x\.com\/2\/tweets/, 201, { data: { id: 't-1' } }]]);
    expect(await M.publishSocialMediaPostNow(null, { id: kept.id }, ctx)).toMatchObject({
      id: kept.id,
      status: 'PUBLISHED',
      externalId: 't-1',
    });

    const [other] = (await M.composeSocialMediaPost(
      null,
      {
        input: {
          text: 'Bye',
          mediaUrl: '',
          link: '',
          accountIds: [account._id.toHexString()],
          draft: true,
        },
      },
      ctx,
    )) as { id: string }[];
    expect(await M.deleteSocialMediaPost(null, { id: other.id }, ctx)).toBe(true);
    expect(await SocialMediaPostModel.countDocuments()).toBe(1);
  });

  it('syncs one account or all of them on request', async () => {
    const li = await connectAccount('LINKEDIN', 'LINKEDIN');
    expect(
      await M.syncSocialAccount(null, { id: li._id.toHexString() }, marketing()),
    ).toMatchObject({
      synced: 0,
      error: '',
    });
    expect(await M.syncAllSocialAccounts(null, {}, marketing())).toEqual([
      { accountId: li._id.toHexString(), synced: 0, error: '' },
    ]);
    expect(
      await M.syncSocialAccount(null, { id: new Types.ObjectId().toHexString() }, marketing()),
    ).toMatchObject({ error: 'The account is no longer connected.' });
  });

  it('is refused to somebody outside Marketing, whatever they try', async () => {
    const id = new Types.ObjectId().toHexString();
    const attempts = [
      () => M.syncSocialAccount(null, { id }, employee()),
      () => M.syncAllSocialAccounts(null, {}, employee()),
      () => M.publishSocialMediaPostNow(null, { id }, employee()),
      () => M.deleteSocialMediaPost(null, { id }, employee()),
      () => M.socialMediaIdeas(null, { topic: 'x', count: 1 }, employee()),
    ];
    for (const attempt of attempts) {
      // Some resolvers refuse before returning a promise, so each is called inside one.
      expect(await codeOf(Promise.resolve().then(attempt))).toBe('FORBIDDEN');
    }
  });
});

describe('a post’s numbers', () => {
  const fields = socialPostsResolvers.SocialMediaPost;

  it('adds likes, comments and shares into engagement, counting missing ones as zero', () => {
    expect(fields.engagement({ metrics: { likes: 4, comments: 2, shares: 1 } })).toBe(7);
    expect(fields.engagement({ metrics: { likes: 4 } })).toBe(4);
    expect(fields.engagement({ metrics: null })).toBe(0);
    expect(fields.engagement({})).toBe(0);
  });

  it('fills in every metric the stored post lacks', () => {
    expect(fields.metrics({ metrics: { likes: 5 } })).toEqual({
      likes: 5,
      comments: 0,
      shares: 0,
      views: 0,
    });
    expect(fields.metrics({ metrics: null })).toEqual({
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
    });
  });
});
