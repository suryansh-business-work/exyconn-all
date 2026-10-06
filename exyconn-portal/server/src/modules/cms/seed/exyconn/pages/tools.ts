import { collectionPage } from './collection-seed';

/** exyconn.com/our-tools and /our-tools/:toolCode (formerly pages/[market]/our-tools/**). */
export const TOOLS_PAGES = [
  collectionPage({
    key: 'our-tools',
    path: '/our-tools',
    kind: 'PAGE',
    title: 'Tools',
    seo: {
      title: 'Tools | Exyconn',
      description: 'Every tool Exyconn builds and maintains, grouped by what it is for.',
    },
    components: ['tools.list'],
  }),
  collectionPage({
    key: 'our-tool',
    path: '/our-tools/:toolCode',
    kind: 'TEMPLATE',
    title: 'Tool',
    seo: { title: '{name} | Exyconn Tools', description: '{summary}' },
    components: ['tools.detail'],
  }),
];
