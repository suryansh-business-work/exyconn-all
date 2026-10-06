import type { CmsComponentDef } from './types';

/**
 * The case studies' words as they were before the CMS. Stories stay in Website › Case
 * Studies; these components read them for the site they are placed on.
 */
export const CASESTUDY_LIST_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Case studies', href: '' },
  ],
  title: 'Real projects, measurable outcomes',
  lede: 'How businesses put AI, automation and modern software to work — and what changed.',
  countLabel: '{count} published stories',
  resultsLabel: 'Results',
  chapterLabel: 'Stories',
  chapterTitle: 'Outcomes our clients measured',
  emptyChapterTitle: 'Client stories',
  filters: {
    label: 'Filter case studies',
    sheetLabel: 'Filters',
    industryLabel: 'Industry',
    serviceLabel: 'Service',
    all: 'All',
    searchLabel: 'Search stories',
    searchPlaceholder: 'Client, industry or service',
    sortLabel: 'Sort',
    sortFeatured: 'Featured first',
    sortNewest: 'Newest',
    sortOldest: 'Oldest',
    countTemplate: '{shown} of {total} stories',
  },
  featured: 'Featured',
  read: 'Read the story',
  noMatch: 'No story matches those filters.',
  empty: {
    label: 'Nothing published yet',
    title: 'Our first case studies are on their way',
    text: 'Client stories appear here as they are published. Meanwhile, see the services and AI work behind them.',
    primary: { label: 'Our services', href: '/services' },
    secondary: { label: 'AI solutions', href: '/ai' },
  },
  cta: {
    label: 'Your project',
    title: 'Start a story of your own',
    text: 'Tell us the outcome you need. We reply within 24 hours.',
    primary: { label: 'Get a quote', href: '/get-a-quote' },
    secondary: { label: 'Contact', href: '/contact' },
  },
};

export const CASESTUDY_ARTICLE_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Case studies', href: '/case-studies' },
  ],
  tocLabel: 'On this page',
  resultsLabel: 'Results',
  snapshot: {
    title: 'Snapshot',
    industry: 'Industry',
    services: 'Services',
    published: 'Published',
    author: 'Written by',
    pdf: 'Download PDF',
  },
  back: { label: 'All case studies', href: '/case-studies' },
  cta: {
    label: 'Your project',
    title: 'Start a similar project',
    text: 'Tell us where you are today; we will show you how we would approach it.',
    primary: { label: 'Get a quote', href: '/get-a-quote' },
    secondary: { label: 'All case studies', href: '/case-studies' },
  },
};

export const CASESTUDY_COMPONENTS = [
  {
    key: 'casestudy.list',
    label: 'Case study list',
    category: 'Collections',
    description:
      "The case studies' band with the headline results, the filterable list of this site's stories (or the empty state) and the closing call to action.",
    defaultProps: CASESTUDY_LIST_PROPS,
  },
  {
    key: 'casestudy.article',
    label: 'Case study',
    category: 'Collections',
    description:
      'One story, for the /case-studies/:slug template: results, snapshot, contents, the story and the call to action. A slug with no story is a 404.',
    defaultProps: CASESTUDY_ARTICLE_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
