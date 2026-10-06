import { newsletter } from './cms.newsletter';
import {
  publicIssue,
  publicIssues,
  publicPage,
  publicPaths,
  publicSite,
  publicSubscribe,
  type NewsletterSignup,
} from './cms.public';
import { siteIdFor } from './cms.sites';

type Captcha = { token: string; answer: string };

/** What the website reads to render a CMS site — unauthenticated, published content only. */
export const cmsPublicResolvers = {
  Query: {
    publicCmsSite: (_p: unknown, { host }: { host: string }) => publicSite(host),
    publicCmsPage: (
      _p: unknown,
      a: { siteId: string; path: string; previewToken?: string | null },
    ) => publicPage(a.siteId, a.path, a.previewToken),
    publicCmsPaths: (_p: unknown, { siteId }: { siteId: string }) => publicPaths(siteId),
    publicNewsletterIssues: async (_p: unknown, { site }: { site?: string | null }) =>
      publicIssues(await siteIdFor(site)),
    publicNewsletterIssue: async (
      _p: unknown,
      { slug, site }: { slug: string; site?: string | null },
    ) => publicIssue(await siteIdFor(site), slug),
  },
  Mutation: {
    subscribeNewsletter: async (
      _p: unknown,
      { input, captcha }: { input: NewsletterSignup; captcha: Captcha },
    ) => publicSubscribe(await siteIdFor(input.site), input, captcha),
    unsubscribeNewsletter: (_p: unknown, { token }: { token: string }) =>
      newsletter.unsubscribeByToken(token),
  },
};
