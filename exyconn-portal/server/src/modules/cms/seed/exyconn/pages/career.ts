import { collectionPage } from './collection-seed';

/**
 * exyconn.com's careers: /career, /career/gigs and the gig, company and role templates
 * (formerly pages/[market]/career/**).
 */
export const CAREER_PAGES = [
  collectionPage({
    key: 'career',
    path: '/career',
    kind: 'PAGE',
    title: 'Careers',
    seo: {
      title: 'Careers & Freelance Gigs | Exyconn',
      description:
        'Explore career opportunities across Exyconn, Spentiva, Sibera, and Duncit. Full-time roles and freelance gigs in AI, FinTech, community apps, and more.',
      keywords: 'careers, jobs, freelance, gigs, AI jobs, SaaS jobs, remote jobs, Exyconn careers',
      ogImageUrl: '/career/og-image.png',
    },
    components: ['career.index'],
  }),
  collectionPage({
    key: 'career-gigs',
    path: '/career/gigs',
    kind: 'PAGE',
    title: 'Freelance gigs',
    seo: {
      title: 'Freelance Gigs & Short Projects | Exyconn',
      description:
        "Find freelance opportunities and short-term contract projects across Development, Design, Writing, Video, Data, and Marketing with Exyconn's portfolio companies.",
    },
    components: ['career.gigs'],
  }),
  collectionPage({
    key: 'career-gig',
    path: '/career/gig/:gigId',
    kind: 'TEMPLATE',
    title: 'Freelance gig',
    seo: { title: '{title} | Freelance Gig | Exyconn', description: '{summary}' },
    components: ['career.gig'],
  }),
  collectionPage({
    key: 'career-company',
    path: '/career/company/:companySlug',
    kind: 'TEMPLATE',
    title: 'Company careers',
    seo: {
      title: 'Careers at {name} | Exyconn',
      description: '{tagline} {jobCount} open positions in {industry}.',
      keywords: '{name} careers, {name} jobs, {industry} jobs, remote jobs',
      ogImageUrl: '{logo}',
    },
    components: ['career.company'],
  }),
  collectionPage({
    key: 'career-job',
    path: '/career/company/:companySlug/job/:jobId',
    kind: 'TEMPLATE',
    title: 'Job opening',
    seo: {
      title: '{title} | {company} Careers',
      description: '{summary}',
      keywords: '{title}, {company} careers, {category} jobs, {skills}',
      ogImageUrl: '{logo}',
    },
    components: ['career.job'],
  }),
];
