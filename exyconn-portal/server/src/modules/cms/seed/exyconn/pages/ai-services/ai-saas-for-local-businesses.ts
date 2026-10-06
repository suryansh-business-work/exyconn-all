import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-saas-for-local-businesses (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_SAAS_FOR_LOCAL_BUSINESSES_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-saas-for-local-businesses',
  path: '/ai-services/ai-saas-for-local-businesses',
  kind: 'PAGE',
  title: 'AI SaaS for Local Businesses | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI SaaS for Local Businesses | AI Services | Exyconn',
    description:
      'Bookings, reviews and customer messaging automated for businesses with a physical presence.',
    keywords: 'AI SaaS for Local Businesses, Industry Platforms, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-saas-for-local-businesses',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI SaaS for Local Businesses',
        description:
          'Clinics, salons, restaurants and trades need AI that fits a working day, not an IT department. We build simple, reliable automation for bookings, reminders, reviews and repeat custom — set up once and left to run.',
        url: 'https://exyconn.com/ai-services/ai-saas-for-local-businesses',
        serviceType: 'Industry Platforms',
        category: 'Industry Platforms',
        areaServed: 'Worldwide',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI SaaS for Local Businesses deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Bookings and reminders handled automatically',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Review requests timed to the visit',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Missed-call and after-hours enquiry follow-up',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Set up for you, with nothing to administer',
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
            name: 'Industry Platforms',
            item: 'https://exyconn.com/ai-services?cat=vertical-platforms',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI SaaS for Local Businesses',
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
          label: 'Industry Platforms',
          href: '/ai-services?cat=vertical-platforms',
        },
        {
          label: 'AI SaaS for Local Businesses',
          href: '',
        },
      ],
      title: 'AI SaaS for Local Businesses',
      lede: 'Bookings, reviews and customer messaging automated for businesses with a physical presence.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      scene: {
        shapes: ['cloudStack'],
      },
      glyph: '',
      tagline: '',
    }),
    place('aiservice.approach', {
      index: 1,
      label: 'Approach',
      title: 'How we approach it',
      description:
        'Clinics, salons, restaurants and trades need AI that fits a working day, not an IT department. We build simple, reliable automation for bookings, reminders, reviews and repeat custom — set up once and left to run.',
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
        title: 'Industry Platforms',
        description: 'Vertical AI software shaped around how one industry actually operates.',
        href: '/ai-services?cat=vertical-platforms',
        link: 'See the whole category',
      },
    }),
    place('aiservice.outcomes', {
      index: 2,
      label: 'Deliverables',
      title: 'What you get',
      outcomes: [
        'Bookings and reminders handled automatically',
        'Review requests timed to the visit',
        'Missed-call and after-hours enquiry follow-up',
        'Set up for you, with nothing to administer',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Industry Platforms',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/vertical-ai-saas',
          title: 'Vertical AI SaaS',
          text: 'A complete AI SaaS product built for one industry — from idea to launch.',
        },
        {
          href: '/ai-services/ai-healthcare-software',
          title: 'AI Healthcare Software',
          text: 'Clinical and administrative AI built to the handling rules healthcare requires.',
        },
        {
          href: '/ai-services/ai-real-estate-software',
          title: 'AI Real Estate Software',
          text: 'Listing, lead and document workflows automated for property businesses.',
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
