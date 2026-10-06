import { collectionPage } from './collection-seed';

/** exyconn.com/blog and /blog/:slug (formerly pages/[market]/blog/{index,[slug]}.astro). */
export const BLOG_PAGES = [
  collectionPage({
    key: 'blog',
    path: '/blog',
    kind: 'PAGE',
    title: 'Blog',
    seo: {
      title: 'Blog | AI Insights & Tech Trends | Exyconn',
      description:
        "Read the latest articles, guides, and trends on AI automation, SaaS, and digital transformation from Exyconn's team. Stay ahead with actionable insights.",
      keywords:
        'Exyconn blog, AI insights, SaaS trends, digital innovation, automation, business technology',
    },
    components: ['blog.list'],
  }),
  collectionPage({
    key: 'blog-article',
    path: '/blog/:slug',
    kind: 'TEMPLATE',
    title: 'Blog article',
    seo: {
      title: '{title} | Exyconn Blog',
      description: '{summary}',
      keywords: '{tags}',
      ogImageUrl: '{coverImage}',
    },
    components: ['blog.article'],
  }),
];
