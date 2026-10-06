import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-compliance-automation (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_COMPLIANCE_AUTOMATION_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-compliance-automation',
  path: '/ai-services/ai-compliance-automation',
  kind: 'PAGE',
  title: 'AI Compliance Automation | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Compliance Automation | AI Services | Exyconn',
    description:
      'Evidence collection and control monitoring kept current instead of rebuilt each audit.',
    keywords: 'AI Compliance Automation, Business Operations, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-compliance-automation',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Compliance Automation',
        description:
          'Continuous evidence collection, policy mapping and control monitoring so an audit is a report rather than a project. Built for teams carrying obligations like SOC 2, ISO 27001 or sector-specific regimes.',
        url: 'https://exyconn.com/ai-services/ai-compliance-automation',
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
          name: 'AI Compliance Automation deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Evidence collected continuously, not before the audit',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Controls mapped across overlapping frameworks',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Drift and gaps flagged as they appear',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Audit reports produced from live data',
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
            name: 'AI Compliance Automation',
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
          label: 'AI Compliance Automation',
          href: '',
        },
      ],
      title: 'AI Compliance Automation',
      lede: 'Evidence collection and control monitoring kept current instead of rebuilt each audit.',
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
        'Continuous evidence collection, policy mapping and control monitoring so an audit is a report rather than a project. Built for teams carrying obligations like SOC 2, ISO 27001 or sector-specific regimes.',
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
        'Evidence collected continuously, not before the audit',
        'Controls mapped across overlapping frameworks',
        'Drift and gaps flagged as they appear',
        'Audit reports produced from live data',
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
          href: '/ai-services/ai-finance-accounting',
          title: 'AI Finance & Accounting',
          text: 'Reconciliation, payables and reporting automated with the audit trail intact.',
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
