import type { CmsComponentDef } from './types';

/**
 * The company policies pages' words as they were before the CMS. The policies themselves are
 * published from Legal.
 */
const POLICY_NOTICE = {
  empty: {
    title: 'No company policies are published yet',
    text: 'When Legal publishes a policy it appears here with its version and the date it took effect.',
  },
  error: {
    title: "Policies can't be loaded right now",
    text: "We couldn't reach the policy library. Please try again in a few minutes.",
  },
  fallbackIntro: "Our website's own policies are always available:",
  fallbacks: [
    {
      label: 'Privacy policy',
      text: 'How we collect, use, and protect your personal information.',
      href: '/privacy-policy',
    },
    {
      label: 'Cookie policy',
      text: 'Understanding how we use cookies to improve your experience.',
      href: '/cookies',
    },
  ],
};

/** The other legal pages, as the "Related policies" cards at the end of each policies page. */
const POLICY_RELATED = {
  title: 'Related policies',
  links: [
    {
      label: 'Privacy policy',
      text: 'How we collect, use, and protect your personal information.',
      href: '/privacy-policy',
    },
    {
      label: 'Cookie policy',
      text: 'Understanding how we use cookies to improve your experience.',
      href: '/cookies',
    },
    {
      label: 'Legal requests',
      text: 'Copyright, takedown, trademark and privacy requests.',
      href: '/legal',
    },
    {
      label: 'Raise a grievance',
      text: 'Share a concern with our compliance team, confidentially.',
      href: '/grievance',
    },
    { label: 'Contact us', text: 'Anything else — reach the team directly.', href: '/contact' },
  ],
};

export const POLICY_LIST_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Legal', href: '/legal' },
    { label: 'Policies', href: '' },
  ],
  title: 'Company policies',
  lede: 'The commitments we publish, and when each one took effect.',
  heading: 'Policies in effect',
  meta: 'Version {version} · Effective {effective} · Updated {updated}',
  notice: POLICY_NOTICE,
  related: POLICY_RELATED,
};

export const POLICY_DETAIL_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Policies', href: '/policies' },
  ],
  fallbackTitle: 'Policy',
  fallbackSummary: 'An Exyconn company policy.',
  updatedLabel: 'Last updated',
  summaryTitle: 'In plain words',
  versionLine: 'Version {version}, in effect from {effective}.',
  tocLabel: 'On this page',
  notice: POLICY_NOTICE,
  related: POLICY_RELATED,
};

export const POLICY_COMPONENTS = [
  {
    key: 'policy.list',
    label: 'Policies list',
    category: 'Collections',
    description:
      'The policies band and every policy Legal has published, with its version and dates (or a notice when there are none or the library cannot be reached).',
    defaultProps: POLICY_LIST_PROPS,
  },
  {
    key: 'policy.detail',
    label: 'Policy',
    category: 'Collections',
    description:
      'One policy, for the /policies/:slug template: its plain-words summary, contents and wording. An unknown slug is a 404; an unreachable library a 503 with a notice.',
    defaultProps: POLICY_DETAIL_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
