import { collectionPage } from './collection-seed';

/** exyconn.com/newsletter and /newsletter/:slug: the issues, each with the sign-up under it. */
export const NEWSLETTER_PAGES = [
  collectionPage({
    key: 'newsletter',
    path: '/newsletter',
    kind: 'PAGE',
    title: 'Newsletter',
    seo: {
      title: 'Newsletter | Exyconn',
      description:
        'Every issue of the Exyconn newsletter: what we are building with AI, what we learned shipping it, and the news worth your time.',
      keywords: 'Exyconn newsletter, AI newsletter, automation, SaaS, product updates',
    },
    components: ['newsletter.list', 'newsletter.signup'],
  }),
  collectionPage({
    key: 'newsletter-issue',
    path: '/newsletter/:slug',
    kind: 'TEMPLATE',
    title: 'Newsletter issue',
    seo: {
      title: '{title} | Exyconn Newsletter',
      description: '{summary}',
      ogImageUrl: '{coverImage}',
    },
    components: ['newsletter.issue', 'newsletter.signup'],
  }),
];
