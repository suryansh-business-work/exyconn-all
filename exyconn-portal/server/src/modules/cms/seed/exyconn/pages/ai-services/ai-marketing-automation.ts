import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-marketing-automation (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_MARKETING_AUTOMATION_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-marketing-automation',
  path: '/ai-services/ai-marketing-automation',
  kind: 'PAGE',
  title: 'AI Marketing Automation | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Marketing Automation | AI Services | Exyconn',
    description:
      'Campaign production and personalisation at a volume a small team cannot reach manually.',
    keywords: 'AI Marketing Automation, Revenue & Growth, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-marketing-automation',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Marketing Automation',
        description:
          'Content production, audience segmentation and campaign variants generated and tested continuously. Brand voice is defined once and applied everywhere, so scale does not turn into a wall of generic copy.',
        url: 'https://exyconn.com/ai-services/ai-marketing-automation',
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
          name: 'AI Marketing Automation deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Campaign content produced against a defined brand voice',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Segmentation driven by behaviour, not static lists',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Variant testing running continuously',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Performance reported against pipeline, not opens',
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
            name: 'AI Marketing Automation',
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
          label: 'AI Marketing Automation',
          href: '',
        },
      ],
      title: 'AI Marketing Automation',
      lede: 'Campaign production and personalisation at a volume a small team cannot reach manually.',
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
        'Content production, audience segmentation and campaign variants generated and tested continuously. Brand voice is defined once and applied everywhere, so scale does not turn into a wall of generic copy.',
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
        'Campaign content produced against a defined brand voice',
        'Segmentation driven by behaviour, not static lists',
        'Variant testing running continuously',
        'Performance reported against pipeline, not opens',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Revenue & Growth',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-sales-automation',
          title: 'AI Sales Automation',
          text: 'Research, outreach and follow-up handled so reps spend their time in conversations.',
        },
        {
          href: '/ai-services/ai-customer-support',
          title: 'AI Customer Support',
          text: 'Deflect the repetitive tickets and hand the rest over with full context.',
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
