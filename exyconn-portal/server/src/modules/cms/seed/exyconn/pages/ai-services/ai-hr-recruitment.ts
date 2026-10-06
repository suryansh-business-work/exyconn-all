import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-hr-recruitment (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_HR_RECRUITMENT_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-hr-recruitment',
  path: '/ai-services/ai-hr-recruitment',
  kind: 'PAGE',
  title: 'AI HR & Recruitment | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI HR & Recruitment | AI Services | Exyconn',
    description: 'Screening, scheduling and onboarding automated with bias controls built in.',
    keywords: 'AI HR & Recruitment, Business Operations, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-hr-recruitment',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI HR & Recruitment',
        description:
          'Sourcing, screening and interview scheduling automated, plus onboarding that runs itself. Screening criteria are explicit and auditable, because hiring decisions have to be explainable to candidates and regulators alike.',
        url: 'https://exyconn.com/ai-services/ai-hr-recruitment',
        serviceType: 'Business Operations',
        category: 'Business Operations',
        areaServed: 'Worldwide',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI HR & Recruitment deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Applications screened against stated, auditable criteria',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Interview scheduling coordinated automatically',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Onboarding tasks generated per role',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Decision records kept for audit',
            },
          ],
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://exyconn.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI services',
            item: 'https://exyconn.com/ai-services',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Business Operations',
            item: 'https://exyconn.com/ai-services?cat=business-operations',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI HR & Recruitment',
          },
        ],
      },
    ],
  },
  html: [
    place('detail.stage', {
      family: 'services',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'AI services',
          href: '/ai-services',
        },
        {
          label: 'Business Operations',
          href: '/ai-services?cat=business-operations',
        },
        {
          label: 'AI HR & Recruitment',
          href: '',
        },
      ],
      title: 'AI HR & Recruitment',
      lede: 'Screening, scheduling and onboarding automated with bias controls built in.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      scene: {
        shapes: ['dataflow'],
      },
      glyph: '',
      tagline: '',
    }),
    place('aiservice.approach', {
      index: 1,
      label: 'Approach',
      title: 'How we approach it',
      description:
        'Sourcing, screening and interview scheduling automated, plus onboarding that runs itself. Screening criteria are explicit and auditable, because hiring decisions have to be explainable to candidates and regulators alike.',
      scopeTitle: 'Scope this for your business',
      scopeText:
        'Send us the workflow you want this applied to. You get a scope, a timeline and a price — not a discovery invoice.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      category: {
        title: 'Business Operations',
        description:
          'The back office — hiring, finance and compliance — with the manual passes removed.',
        href: '/ai-services?cat=business-operations',
        link: 'See the whole category',
      },
    }),
    place('aiservice.outcomes', {
      index: 2,
      label: 'Deliverables',
      title: 'What you get',
      outcomes: [
        'Applications screened against stated, auditable criteria',
        'Interview scheduling coordinated automatically',
        'Onboarding tasks generated per role',
        'Decision records kept for audit',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Business Operations',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-recruitment-marketplace',
          title: 'AI Recruitment Marketplace',
          text: 'Two-sided hiring platforms with matching that improves as they are used.',
        },
        {
          href: '/ai-services/ai-finance-accounting',
          title: 'AI Finance & Accounting',
          text: 'Reconciliation, payables and reporting automated with the audit trail intact.',
        },
        {
          href: '/ai-services/ai-compliance-automation',
          title: 'AI Compliance Automation',
          text: 'Evidence collection and control monitoring kept current instead of rebuilt each audit.',
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: '',
      title: "Tell us the process, we'll scope the AI",
      text: 'Bring one workflow that costs your team too much time. We will come back with what an AI system can take over, what it should not, and what it costs to build.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      echoShape: 0,
    }),
  ].join(''),
  css: '',
};
