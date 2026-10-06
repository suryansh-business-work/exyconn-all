import type { CmsComponentDef } from './types';

const TOOLS_APP = 'https://tools.exyconn.com';

/**
 * The tools directory's words as they were before the CMS. The tools and their categories stay
 * in Website › Tools.
 */
export const TOOLS_LIST_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: '' },
  ],
  title: 'Free tools we build and maintain',
  lede: 'Small, focused tools for writing, building and branding — grouped by what they are for.',
  stats: '{tools} tools · {categories} categories',
  early: '{count} in early release',
  appLink: { label: 'Browse the tools app', href: TOOLS_APP, external: true },
  chapterLabel: 'Directory',
  chapterTitle: 'Pick a tool, open it, done',
  filters: {
    label: 'Filter tools',
    sheetLabel: 'Categories',
    categoryLabel: 'Category',
    all: 'All',
    searchLabel: 'Search tools',
    searchPlaceholder: 'Name or purpose',
    countTemplate: '{shown} of {total} tools',
  },
  mvp: 'Early release',
  details: 'Details',
  open: 'Open tool',
  opensApp: '(opens tools.exyconn.com)',
  noMatch: 'No tool matches those filters.',
  empty: {
    label: 'Nothing published yet',
    title: 'The directory is being stocked',
    text: 'Tools appear here as they are published. The tools app already runs everything we have built.',
    primary: { label: 'Open the tools app', href: TOOLS_APP, external: true },
    secondary: { label: 'Our services', href: '/services', external: false },
  },
  cta: {
    label: 'Need something bespoke?',
    title: 'Need a tool built for your team?',
    text: 'We build internal tools and SaaS products end to end.',
    primary: { label: 'Request a tool', href: '/contact' },
    secondary: { label: 'Software as a service', href: '/services/software-as-a-service' },
  },
};

export const TOOLS_DETAIL_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: '/our-tools' },
  ],
  open: 'Open tool',
  details: 'Details',
  previewLabel: 'Where it runs',
  about: 'About this tool',
  features: 'What it does',
  useCases: 'Where people use it',
  pricing: 'Pricing',
  related: 'More in this category',
  mvp: 'Early release',
  cta: {
    label: 'Need something bespoke?',
    title: 'Need a tool built for your team?',
    text: '',
    primary: { label: 'Request a tool', href: '/contact' },
    secondary: { label: 'All tools', href: '/our-tools' },
  },
};

export const TOOLS_COMPONENTS = [
  {
    key: 'tools.list',
    label: 'Tools directory',
    category: 'Collections',
    description:
      'The tools band, the filterable directory of published tools by category (or the empty state) and the call to action.',
    defaultProps: TOOLS_LIST_PROPS,
  },
  {
    key: 'tools.detail',
    label: 'Tool',
    category: 'Collections',
    description:
      'One tool, for the /our-tools/:toolCode template: where it runs, what it does, pricing and more tools in its category. An unknown code is a 404.',
    defaultProps: TOOLS_DETAIL_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
