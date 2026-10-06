import { randomBytes } from 'node:crypto';
import { badRequest, notFound } from '../../utils/errors';
import { isEmailAddress } from '../../utils/emailAddress';
import { withIds } from '../../utils/serialize';
import { escapeRegex } from '../../utils/tableQuery';
import { NewsletterIssueModel, NewsletterSubscriberModel } from './models';

export interface NewsletterIssueInput {
  siteId: string;
  slug: string;
  title: string;
  summary?: string | null;
  coverImage?: string | null;
  content: string;
  contentCss?: string | null;
  isActive: boolean;
  publishedAt?: string | null;
}

const SLUG = /^[a-z\d][a-z\d-]{0,118}[a-z\d]$/;
const MAX_PAGE_SIZE = 200;

function issueFields(input: NewsletterIssueInput) {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG.test(slug)) {
    badRequest('Use lower-case letters, digits and dashes for the issue address.');
  }
  if (input.title.trim() === '') {
    badRequest('Give the issue a title.');
  }
  return {
    siteId: input.siteId,
    slug,
    title: input.title.trim(),
    summary: (input.summary ?? '').trim(),
    coverImage: (input.coverImage ?? '').trim(),
    content: input.content,
    contentCss: input.contentCss ?? '',
    isActive: input.isActive,
    publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
  };
}

async function pageOf<T>(
  model: typeof NewsletterIssueModel | typeof NewsletterSubscriberModel,
  filter: Record<string, unknown>,
  page: number,
  pageSize: number,
  sort: Record<string, 1 | -1>,
) {
  const size = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
  const [rows, totalCount] = await Promise.all([
    (model as typeof NewsletterIssueModel)
      .find(filter)
      .sort(sort)
      .skip(Math.max(page, 0) * size)
      .limit(size)
      .lean(),
    (model as typeof NewsletterIssueModel).countDocuments(filter),
  ]);
  return { rows: withIds(rows as Array<{ _id: unknown }>) as T[], totalCount };
}

function searchFilter(siteId: string, search: string | null | undefined, fields: string[]) {
  const filter: Record<string, unknown> = { siteId };
  const text = (search ?? '').trim().slice(0, 100);
  if (text) {
    const pattern = { $regex: escapeRegex(text), $options: 'i' };
    filter.$or = fields.map((field) => ({ [field]: pattern }));
  }
  return filter;
}

/** Newsletter issues published on a site, and the people who signed up for them. */
export const newsletter = {
  issues: (siteId: string, page: number, pageSize: number, search?: string | null) =>
    pageOf(
      NewsletterIssueModel,
      searchFilter(siteId, search, ['title', 'slug', 'summary']),
      page,
      pageSize,
      {
        publishedAt: -1,
      },
    ),

  async createIssue(input: NewsletterIssueInput) {
    const fields = issueFields(input);
    if (await NewsletterIssueModel.exists({ siteId: fields.siteId, slug: fields.slug })) {
      badRequest('Another issue already uses this address.');
    }
    return (await NewsletterIssueModel.create(fields)).toObject();
  },

  async updateIssue(id: string, input: NewsletterIssueInput) {
    const fields = issueFields(input);
    if (
      await NewsletterIssueModel.exists({
        siteId: fields.siteId,
        slug: fields.slug,
        _id: { $ne: id },
      })
    ) {
      badRequest('Another issue already uses this address.');
    }
    const issue = await NewsletterIssueModel.findByIdAndUpdate(id, fields, { new: true }).lean();
    if (!issue) notFound('Newsletter issue');
    return issue;
  },

  async removeIssue(id: string) {
    const result = await NewsletterIssueModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) notFound('Newsletter issue');
    return true;
  },

  subscribers: (siteId: string, page: number, pageSize: number, search?: string | null) =>
    pageOf(
      NewsletterSubscriberModel,
      searchFilter(siteId, search, ['email', 'name']),
      page,
      pageSize,
      {
        createdAt: -1,
      },
    ),

  /**
   * Signs somebody up (or back up). Idempotent per site and address: signing up twice keeps one
   * row, and an unsubscribed reader who signs up again is subscribed again with fresh consent.
   */
  async subscribe(siteId: string, email: string, name: string, source: string) {
    const address = email.trim().toLowerCase();
    if (!isEmailAddress(address)) {
      badRequest('Enter a valid email address.');
    }
    await NewsletterSubscriberModel.findOneAndUpdate(
      { siteId, email: address },
      {
        $set: { status: 'SUBSCRIBED', consentAt: new Date(), name: name.trim().slice(0, 120) },
        $setOnInsert: {
          source: source.slice(0, 300),
          unsubscribeToken: randomBytes(24).toString('hex'),
        },
      },
      { upsert: true },
    );
    return true;
  },

  async setSubscriberStatus(id: string, status: 'SUBSCRIBED' | 'UNSUBSCRIBED') {
    const subscriber = await NewsletterSubscriberModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).lean();
    if (!subscriber) notFound('Subscriber');
    return subscriber;
  },

  /** A reader's own unsubscribe link: the token alone, no sign-in. */
  async unsubscribeByToken(token: string) {
    const result = await NewsletterSubscriberModel.updateOne(
      { unsubscribeToken: token },
      { status: 'UNSUBSCRIBED' },
    );
    return result.matchedCount > 0;
  },

  async removeSubscriber(id: string) {
    const result = await NewsletterSubscriberModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) notFound('Subscriber');
    return true;
  },
};
