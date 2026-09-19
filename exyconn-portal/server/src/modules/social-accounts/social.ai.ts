import { runAssist } from '../ai/ai.actions';
import type { AiActor } from '../ai/ai.service';
import { badRequest } from '../../utils/errors';
import { MS_PER_DAY } from '../analytics/analytics.metrics';
import { SocialMediaPostModel } from './social-post.model';

/** How many posts an analysis reads — enough to see a pattern, not a month's budget. */
const ANALYSED_POSTS = 40;
/** How many of the best posts show the house style when writing ideas. */
const STYLE_EXAMPLES = 8;
const EXCERPT = 240;
const MAX_TOPIC = 300;
const MIN_IDEAS = 1;
const MAX_IDEAS = 10;

const excerpt = (text: string) => (text.length > EXCERPT ? `${text.slice(0, EXCERPT)}…` : text);

interface PostLine {
  network: string;
  publishedAt?: Date | null;
  text: string;
  metrics?: { likes?: number; comments?: number; shares?: number; views?: number } | null;
}

/** One post as a line the model can read: where, when, what and how it did. */
function describe(post: PostLine): string {
  const m = post.metrics ?? {};
  const when = post.publishedAt
    ? post.publishedAt.toISOString().slice(0, 16).replace('T', ' ')
    : 'unknown';
  return `- [${post.network}, ${when} UTC] likes ${m.likes ?? 0}, comments ${m.comments ?? 0}, shares ${m.shares ?? 0}, views ${m.views ?? 0}: "${excerpt(post.text.replaceAll('\n', ' '))}"`;
}

/** The recent published posts, best first — what both assists work from. */
async function recentPosts(days: number, limit: number) {
  return SocialMediaPostModel.aggregate<PostLine>([
    {
      $match: {
        status: 'PUBLISHED',
        publishedAt: { $gte: new Date(Date.now() - days * MS_PER_DAY) },
      },
    },
    {
      $addFields: {
        engagement: { $add: ['$metrics.likes', '$metrics.comments', '$metrics.shares'] },
      },
    },
    { $sort: { engagement: -1 } },
    { $limit: limit },
  ]);
}

/** Reads the last `days` days of posts and says what worked, what did not, and what to try. */
export async function analysePosts(days: number, actor: AiActor): Promise<string> {
  const posts = await recentPosts(days, ANALYSED_POSTS);
  if (posts.length === 0) {
    badRequest(
      'There are no published posts in this period yet. Sync the accounts or publish a post first.',
    );
  }
  const prompt = [
    "You are a social media analyst. These are a company's published posts, best first, with their numbers.",
    'Write a short report in plain text (no Markdown symbols): each section title on its own line ending with a colon, points as lines starting with "- ". Sections:',
    'What works: what the best posts have in common (topics, format, length, tone, links or images).',
    'What falls flat: what the weakest posts share.',
    'When to post: the days and times that did best, if the data shows any.',
    'Try next: five concrete, specific recommendations.',
    'Only use what the data shows; say so when there is too little to tell.',
    '',
    'Posts:',
    ...posts.map(describe),
  ].join('\n');
  return runAssist('Analyse social posts', prompt, actor);
}

/** Writes fresh post ideas on a topic, in the voice of the company's best-performing posts. */
export async function postIdeas(topic: string, count: number, actor: AiActor): Promise<string> {
  const subject = topic.trim();
  if (!subject) badRequest('Say what the posts should be about');
  if (subject.length > MAX_TOPIC) badRequest(`Keep the topic under ${MAX_TOPIC} characters`);
  if (!Number.isInteger(count) || count < MIN_IDEAS || count > MAX_IDEAS) {
    badRequest(`Ask for between ${MIN_IDEAS} and ${MAX_IDEAS} ideas`);
  }
  const examples = await recentPosts(365, STYLE_EXAMPLES);
  const prompt = [
    `Write ${count} social media post ideas about: ${subject}`,
    'Plain text, no Markdown symbols. Number each idea "1.", "2.", … and give: a one-line hook, a ready-to-post draft of at most 260 characters, and the networks it suits best (LinkedIn, Facebook, Instagram, X). Leave a blank line between ideas.',
    'Vary the formats: a question, a tip, a behind-the-scenes, a result with a number, a short story.',
    examples.length > 0
      ? 'Match the voice of these posts, which did well for this company:'
      : 'Keep a clear, friendly, professional voice.',
    ...examples.map(describe),
  ].join('\n');
  return runAssist('Social post ideas', prompt, actor);
}
