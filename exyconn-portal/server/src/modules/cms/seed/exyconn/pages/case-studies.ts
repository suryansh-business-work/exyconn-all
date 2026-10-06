import { collectionPage } from './collection-seed';

/**
 * exyconn.com/case-studies and /case-studies/:slug (formerly
 * pages/[market]/case-studies/{index,[slug]}.astro).
 */
export const CASE_STUDY_PAGES = [
  collectionPage({
    key: 'case-studies',
    path: '/case-studies',
    kind: 'PAGE',
    title: 'Case studies',
    seo: {
      title: 'Case Studies | AI Success Stories | Exyconn',
      description:
        'Explore real-world case studies showcasing how Exyconn delivers AI and automation solutions that drive measurable business results across industries.',
    },
    components: ['casestudy.list'],
  }),
  collectionPage({
    key: 'case-study',
    path: '/case-studies/:slug',
    kind: 'TEMPLATE',
    title: 'Case study',
    seo: {
      title: '{title} | Exyconn Case Study',
      description: '{summary}',
      keywords: '{tags}',
      ogImageUrl: '{coverImage}',
    },
    components: ['casestudy.article'],
  }),
];
