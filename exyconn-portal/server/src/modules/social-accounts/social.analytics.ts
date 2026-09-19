import { SocialMediaPostModel } from './social-post.model';
import {
  MS_PER_DAY,
  dayKeys,
  dayOf,
  fillTrend,
  houseTimezone,
} from '../analytics/analytics.metrics';

/** Likes, comments and shares: what counts as engagement across networks. */
const ENGAGEMENT = { $add: ['$metrics.likes', '$metrics.comments', '$metrics.shares'] };
const TOP_POSTS = 5;

interface Totals {
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

/**
 * What the company's social posts did over the last `days` days: totals, a line per network,
 * engagement per day (in the workspace timezone) and the best-performing posts.
 */
export async function socialAnalytics(days: number) {
  const timeZone = await houseTimezone();
  const since = new Date(Date.now() - days * MS_PER_DAY);
  const published = { status: 'PUBLISHED', publishedAt: { $gte: since } };
  const [totals, byNetwork, perDay, topPosts, scheduled, failed] = await Promise.all([
    SocialMediaPostModel.aggregate<Totals>([
      { $match: published },
      {
        $group: {
          _id: null,
          posts: { $sum: 1 },
          likes: { $sum: '$metrics.likes' },
          comments: { $sum: '$metrics.comments' },
          shares: { $sum: '$metrics.shares' },
          views: { $sum: '$metrics.views' },
        },
      },
    ]),
    SocialMediaPostModel.aggregate<{
      _id: string;
      posts: number;
      engagement: number;
      views: number;
    }>([
      { $match: published },
      {
        $group: {
          _id: '$network',
          posts: { $sum: 1 },
          engagement: { $sum: ENGAGEMENT },
          views: { $sum: '$metrics.views' },
        },
      },
      { $sort: { engagement: -1 } },
    ]),
    SocialMediaPostModel.aggregate<{ _id: string; value: number }>([
      { $match: published },
      { $group: { _id: dayOf('publishedAt', timeZone), value: { $sum: ENGAGEMENT } } },
    ]),
    SocialMediaPostModel.aggregate([
      { $match: published },
      { $addFields: { engagement: ENGAGEMENT } },
      { $sort: { engagement: -1, publishedAt: -1 } },
      { $limit: TOP_POSTS },
    ]),
    SocialMediaPostModel.countDocuments({ status: 'SCHEDULED' }),
    SocialMediaPostModel.countDocuments({ status: 'FAILED' }),
  ]);
  const total = totals[0] ?? { posts: 0, likes: 0, comments: 0, shares: 0, views: 0 };
  return {
    days,
    posts: total.posts,
    likes: total.likes,
    comments: total.comments,
    shares: total.shares,
    views: total.views,
    engagement: total.likes + total.comments + total.shares,
    scheduled,
    failed,
    byNetwork: byNetwork.map((row) => ({
      network: row._id,
      posts: row.posts,
      engagement: row.engagement,
      views: row.views,
    })),
    engagementPerDay: fillTrend(dayKeys(days, timeZone), perDay),
    topPosts: topPosts.map((post) => ({ ...post, id: String(post._id) })),
  };
}
