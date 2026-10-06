import type { CmsComponentDef } from './types';

/**
 * The blog's words as they were before the CMS (exyconn-website's blog pages). Posts stay in
 * Website › Blog; these components read them for the site they are placed on.
 */
export const BLOG_LIST_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '' },
  ],
  title: 'Insights on AI and modern software',
  lede: 'Articles, guides and field notes from the team that builds and runs it.',
  chapterLabel: 'Articles',
  chapterTitle: 'Latest from the team',
  filters: {
    label: 'Filter articles',
    sheetLabel: 'Topics',
    topicLabel: 'Topic',
    allTopics: 'All topics',
    searchLabel: 'Search articles',
    searchPlaceholder: 'Title, topic or summary',
    sortLabel: 'Sort',
    sortNewest: 'Newest',
    sortOldest: 'Oldest',
    countTemplate: '{shown} of {total} articles',
  },
  featured: 'Featured',
  read: 'Read article',
  noMatch: 'No article matches those filters.',
  empty: {
    label: 'Nothing published yet',
    title: 'The first articles are being written',
    text: 'Our team publishes guides and field notes here. Until the first one lands, see what we build or read how it went for clients.',
    primary: { label: 'Explore AI', href: '/ai' },
    secondary: { label: 'Case studies', href: '/case-studies' },
  },
  cta: {
    label: 'Work with us',
    title: 'Turn an idea into a working system',
    text: 'Tell us what you are trying to automate or build. We reply within 24 hours.',
    primary: { label: 'Get a quote', href: '/get-a-quote' },
    secondary: { label: 'Contact', href: '/contact' },
  },
};

export const BLOG_ARTICLE_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
  ],
  tocLabel: 'On this page',
  byLabel: 'Written by',
  tagsLabel: 'Topics',
  share: {
    heading: 'Share this article',
    x: 'Share on X',
    linkedIn: 'Share on LinkedIn',
    copy: 'Copy link',
    copied: 'Link copied',
    copyFailed: 'Copy failed — select the address bar instead',
  },
  relatedLabel: 'Keep reading',
  relatedTitle: 'Related articles',
  read: 'Read article',
  cta: {
    label: 'Work with us',
    title: 'Put these ideas to work',
    text: '',
    primary: { label: 'Get a quote', href: '/get-a-quote' },
    secondary: { label: 'All articles', href: '/blog' },
  },
};

export const BLOG_COMPONENTS = [
  {
    key: 'blog.list',
    label: 'Blog list',
    category: 'Collections',
    description:
      "The blog's band, the filterable list of this site's posts (or the empty state) and the closing call to action.",
    defaultProps: BLOG_LIST_PROPS,
  },
  {
    key: 'blog.article',
    label: 'Blog article',
    category: 'Collections',
    description:
      'One post, for the /blog/:slug template: the article with its contents, author, sharing, related posts and call to action. A slug with no post is a 404.',
    defaultProps: BLOG_ARTICLE_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
