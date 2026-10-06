import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-finance-accounting (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_FINANCE_ACCOUNTING_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-finance-accounting',
  path: '/ai-services/ai-finance-accounting',
  kind: 'PAGE',
  title: 'AI Finance & Accounting | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Finance & Accounting | AI Services | Exyconn',
    description: 'Reconciliation, payables and reporting automated with the audit trail intact.',
    keywords: 'AI Finance & Accounting, Business Operations, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-finance-accounting',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Finance & Accounting',
        description:
          'Invoice capture, reconciliation, expense checking and reporting automated for finance teams. Every automated step leaves a record, because finance automation is only useful if it survives an audit.',
        url: 'https://exyconn.com/ai-services/ai-finance-accounting',
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
          name: 'AI Finance & Accounting deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Invoice and receipt capture into your ledger',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Reconciliation with exceptions flagged for review',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Expense policy checks applied consistently',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'A complete audit trail on every automated action',
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
            name: 'AI Finance & Accounting',
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
          label: 'AI Finance & Accounting',
          href: '',
        },
      ],
      title: 'AI Finance & Accounting',
      lede: 'Reconciliation, payables and reporting automated with the audit trail intact.',
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
        'Invoice capture, reconciliation, expense checking and reporting automated for finance teams. Every automated step leaves a record, because finance automation is only useful if it survives an audit.',
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
        'Invoice and receipt capture into your ledger',
        'Reconciliation with exceptions flagged for review',
        'Expense policy checks applied consistently',
        'A complete audit trail on every automated action',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Business Operations',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-hr-recruitment',
          title: 'AI HR & Recruitment',
          text: 'Screening, scheduling and onboarding automated with bias controls built in.',
        },
        {
          href: '/ai-services/ai-recruitment-marketplace',
          title: 'AI Recruitment Marketplace',
          text: 'Two-sided hiring platforms with matching that improves as they are used.',
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
