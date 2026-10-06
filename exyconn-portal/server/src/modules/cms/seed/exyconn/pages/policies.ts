import { collectionPage } from './collection-seed';

/** exyconn.com/policies and /policies/:slug (formerly pages/[market]/policies/**). */
export const POLICY_PAGES = [
  collectionPage({
    key: 'policies',
    path: '/policies',
    kind: 'PAGE',
    title: 'Policies',
    seo: {
      title: 'Policies | Exyconn',
      description: "Exyconn's published company policies, including privacy, cookies and terms.",
      keywords: 'policies, privacy policy, terms, exyconn',
    },
    components: ['policy.list'],
  }),
  collectionPage({
    key: 'policy',
    path: '/policies/:slug',
    kind: 'TEMPLATE',
    title: 'Policy',
    seo: {
      title: '{title} | Exyconn',
      description: '{summary}',
      keywords: '{titleLower}, exyconn, policy',
    },
    components: ['policy.detail'],
  }),
];
