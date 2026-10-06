import type { CmsComponentDef } from './types';

/**
 * The newsletter: the issues a site publishes (Website › Newsletter › Issues), shown like the
 * blog, and a sign-up form editors can place on any page (Website › Newsletter › Subscribers).
 */
export const NEWSLETTER_LIST_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Newsletter', href: '' },
  ],
  title: 'The Exyconn newsletter',
  lede: 'What we are building, what we learned shipping it, and the AI news worth your time.',
  chapterLabel: 'Issues',
  chapterTitle: 'Every issue so far',
  read: 'Read the issue',
  empty: {
    label: 'Nothing published yet',
    title: 'The first issue is on its way',
    text: 'Sign up below and it lands in your inbox the day it is out. Meanwhile, the blog has our latest writing.',
    primary: { label: 'Read the blog', href: '/blog' },
    secondary: { label: 'Case studies', href: '/case-studies' },
  },
};

export const NEWSLETTER_ISSUE_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Newsletter', href: '/newsletter' },
  ],
  tocLabel: 'In this issue',
  relatedLabel: 'Keep reading',
  relatedTitle: 'Earlier issues',
  read: 'Read the issue',
};

export const NEWSLETTER_SIGNUP_PROPS = {
  label: 'Newsletter',
  title: 'Get the next issue in your inbox',
  text: 'One email per issue. No spam, and you can unsubscribe at any time.',
  nameLabel: 'Name (optional)',
  emailLabel: 'Email address',
  emailPlaceholder: 'you@company.com',
  submit: 'Subscribe',
  busy: 'Subscribing…',
  success: 'Thank you — you are on the list.',
  failure: 'We could not sign you up. Please try again in a moment.',
  invalidEmail: 'Enter a valid email address.',
};

export const NEWSLETTER_COMPONENTS = [
  {
    key: 'newsletter.list',
    label: 'Newsletter issues',
    category: 'Collections',
    description:
      "The newsletter band and this site's published issues, newest first (or the empty state).",
    defaultProps: NEWSLETTER_LIST_PROPS,
  },
  {
    key: 'newsletter.issue',
    label: 'Newsletter issue',
    category: 'Collections',
    description:
      'One issue, for the /newsletter/:slug template: the issue with its contents and earlier issues. A slug with no issue is a 404.',
    defaultProps: NEWSLETTER_ISSUE_PROPS,
  },
  {
    key: 'newsletter.signup',
    label: 'Newsletter sign-up',
    category: 'Forms',
    description:
      "A sign-up form (name optional, email, the site's security question) that adds the visitor to this site's subscribers. Place it on any page.",
    defaultProps: NEWSLETTER_SIGNUP_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
