import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-sales-automation (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_SALES_AUTOMATION_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-sales-automation',
  path: '/ai-services/ai-sales-automation',
  kind: 'PAGE',
  title: 'AI Sales Automation | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Sales Automation | AI Services | Exyconn',
    description:
      'Research, outreach and follow-up handled so reps spend their time in conversations.',
    keywords: 'AI Sales Automation, Revenue & Growth, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-sales-automation',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Sales Automation',
        description:
          'Selling time disappears into research, data entry and follow-up. We automate the surrounding work: prospect research, personalised first touches, CRM hygiene and follow-up sequences that stop the moment a human replies.',
        url: 'https://exyconn.com/ai-services/ai-sales-automation',
        serviceType: 'Revenue & Growth',
        category: 'Revenue & Growth',
        areaServed: 'Worldwide',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI Sales Automation deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Prospect research and enrichment before the first touch',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Personalised outreach that reads as written by a person',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Follow-up that halts on any genuine reply',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'CRM records updated without rep data entry',
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
            name: 'Revenue & Growth',
            item: 'https://exyconn.com/ai-services?cat=revenue-growth',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI Sales Automation',
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
          label: 'Revenue & Growth',
          href: '/ai-services?cat=revenue-growth',
        },
        {
          label: 'AI Sales Automation',
          href: '',
        },
      ],
      title: 'AI Sales Automation',
      lede: 'Research, outreach and follow-up handled so reps spend their time in conversations.',
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
        'Selling time disappears into research, data entry and follow-up. We automate the surrounding work: prospect research, personalised first touches, CRM hygiene and follow-up sequences that stop the moment a human replies.',
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
        title: 'Revenue & Growth',
        description: 'AI on the commercial front line — pipeline, campaigns, support and checkout.',
        href: '/ai-services?cat=revenue-growth',
        link: 'See the whole category',
      },
    }),
    place('aiservice.outcomes', {
      index: 2,
      label: 'Deliverables',
      title: 'What you get',
      outcomes: [
        'Prospect research and enrichment before the first touch',
        'Personalised outreach that reads as written by a person',
        'Follow-up that halts on any genuine reply',
        'CRM records updated without rep data entry',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Revenue & Growth',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-customer-support',
          title: 'AI Customer Support',
          text: 'Deflect the repetitive tickets and hand the rest over with full context.',
        },
        {
          href: '/ai-services/ai-marketing-automation',
          title: 'AI Marketing Automation',
          text: 'Campaign production and personalisation at a volume a small team cannot reach manually.',
        },
        {
          href: '/ai-services/ai-ecommerce-automation',
          title: 'AI E-commerce Automation',
          text: 'Catalogue, merchandising and post-purchase messaging automated across your storefront.',
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
