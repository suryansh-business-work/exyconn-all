import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-customer-support (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_CUSTOMER_SUPPORT_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-customer-support',
  path: '/ai-services/ai-customer-support',
  kind: 'PAGE',
  title: 'AI Customer Support | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Customer Support | AI Services | Exyconn',
    description: 'Deflect the repetitive tickets and hand the rest over with full context.',
    keywords: 'AI Customer Support, Revenue & Growth, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-customer-support',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Customer Support',
        description:
          'Support AI grounded in your documentation and past resolutions, so it answers from what is true for your product rather than what sounds plausible. It escalates early on anything ambiguous, because a wrong confident answer costs more than a transfer.',
        url: 'https://exyconn.com/ai-services/ai-customer-support',
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
          name: 'AI Customer Support deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Answers grounded in your docs and resolved tickets',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Measured deflection rate, not a vanity number',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Escalation with the full conversation attached',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Gaps in your documentation surfaced from real questions',
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
            name: 'AI Customer Support',
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
          label: 'AI Customer Support',
          href: '',
        },
      ],
      title: 'AI Customer Support',
      lede: 'Deflect the repetitive tickets and hand the rest over with full context.',
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
        'Support AI grounded in your documentation and past resolutions, so it answers from what is true for your product rather than what sounds plausible. It escalates early on anything ambiguous, because a wrong confident answer costs more than a transfer.',
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
        'Answers grounded in your docs and resolved tickets',
        'Measured deflection rate, not a vanity number',
        'Escalation with the full conversation attached',
        'Gaps in your documentation surfaced from real questions',
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
