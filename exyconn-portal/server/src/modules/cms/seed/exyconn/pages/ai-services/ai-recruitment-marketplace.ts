import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-recruitment-marketplace (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_RECRUITMENT_MARKETPLACE_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-recruitment-marketplace',
  path: '/ai-services/ai-recruitment-marketplace',
  kind: 'PAGE',
  title: 'AI Recruitment Marketplace | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Recruitment Marketplace | AI Services | Exyconn',
    description: 'Two-sided hiring platforms with matching that improves as they are used.',
    keywords: 'AI Recruitment Marketplace, Business Operations, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-recruitment-marketplace',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Recruitment Marketplace',
        description:
          'For businesses building a hiring marketplace rather than hiring into one. We build the matching engine, the supply and demand mechanics, and the trust features a two-sided market needs before it can grow.',
        url: 'https://exyconn.com/ai-services/ai-recruitment-marketplace',
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
          name: 'AI Recruitment Marketplace deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Matching engine tuned on placement outcomes',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Two-sided onboarding and verification',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Reputation and trust mechanics',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Marketplace analytics on liquidity and fill rate',
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
            name: 'AI Recruitment Marketplace',
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
          label: 'AI Recruitment Marketplace',
          href: '',
        },
      ],
      title: 'AI Recruitment Marketplace',
      lede: 'Two-sided hiring platforms with matching that improves as they are used.',
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
        'For businesses building a hiring marketplace rather than hiring into one. We build the matching engine, the supply and demand mechanics, and the trust features a two-sided market needs before it can grow.',
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
        'Matching engine tuned on placement outcomes',
        'Two-sided onboarding and verification',
        'Reputation and trust mechanics',
        'Marketplace analytics on liquidity and fill rate',
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
