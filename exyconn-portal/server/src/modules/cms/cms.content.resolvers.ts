import type { GraphQLContext } from '../../middleware/auth';
import { withId } from '../../utils/serialize';
import { cmsEditor } from './cms.access';
import { newsletter, type NewsletterIssueInput } from './cms.newsletter';

type Id = { id: string };
type Ctx = GraphQLContext;
type Paging = { siteId: string; page: number; pageSize: number; search?: string | null };

/** Website › Newsletter, for the website team. */
export const cmsContentResolvers = {
  Query: {
    newsletterIssues: async (_p: unknown, a: Paging, ctx: Ctx) => {
      await cmsEditor(ctx, 'Newsletter', 'VIEW');
      return newsletter.issues(a.siteId, a.page, a.pageSize, a.search);
    },
    newsletterSubscribers: async (_p: unknown, a: Paging, ctx: Ctx) => {
      await cmsEditor(ctx, 'Newsletter', 'VIEW');
      return newsletter.subscribers(a.siteId, a.page, a.pageSize, a.search);
    },
  },
  Mutation: {
    createNewsletterIssue: async (
      _p: unknown,
      { input }: { input: NewsletterIssueInput },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'Newsletter', 'CREATE');
      return withId(await newsletter.createIssue(input));
    },
    updateNewsletterIssue: async (
      _p: unknown,
      { id, input }: Id & { input: NewsletterIssueInput },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'Newsletter', 'EDIT');
      return withId(await newsletter.updateIssue(id, input));
    },
    deleteNewsletterIssue: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'Newsletter', 'DELETE');
      return newsletter.removeIssue(id);
    },
    addNewsletterSubscriber: async (
      _p: unknown,
      a: { siteId: string; email: string; name?: string | null },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'Newsletter', 'CREATE');
      return newsletter.subscribe(a.siteId, a.email, a.name ?? '', 'portal');
    },
    setNewsletterSubscriberStatus: async (
      _p: unknown,
      { id, status }: Id & { status: 'SUBSCRIBED' | 'UNSUBSCRIBED' },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'Newsletter', 'EDIT');
      return withId(await newsletter.setSubscriberStatus(id, status));
    },
    deleteNewsletterSubscriber: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'Newsletter', 'DELETE');
      return newsletter.removeSubscriber(id);
    },
  },
};
