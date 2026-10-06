import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-healthcare-software (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_HEALTHCARE_SOFTWARE_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-healthcare-software',
  path: '/ai-services/ai-healthcare-software',
  kind: 'PAGE',
  title: 'AI Healthcare Software | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Healthcare Software | AI Services | Exyconn',
    description: 'Clinical and administrative AI built to the handling rules healthcare requires.',
    keywords: 'AI Healthcare Software, Industry Platforms, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-healthcare-software',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Healthcare Software',
        description:
          'Documentation, triage support and administrative automation for healthcare providers, built around patient data handling obligations from the start. Clinical judgement stays with clinicians; the software removes the paperwork surrounding it.',
        url: 'https://exyconn.com/ai-services/ai-healthcare-software',
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
          name: 'AI Healthcare Software deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Consultation documentation drafted automatically',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Administrative and billing workflows automated',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Patient data handling designed to your jurisdiction',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Clinician review retained on anything clinical',
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
            name: 'AI Healthcare Software',
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
          label: 'AI Healthcare Software',
          href: '',
        },
      ],
      title: 'AI Healthcare Software',
      lede: 'Clinical and administrative AI built to the handling rules healthcare requires.',
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
        'Documentation, triage support and administrative automation for healthcare providers, built around patient data handling obligations from the start. Clinical judgement stays with clinicians; the software removes the paperwork surrounding it.',
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
        'Consultation documentation drafted automatically',
        'Administrative and billing workflows automated',
        'Patient data handling designed to your jurisdiction',
        'Clinician review retained on anything clinical',
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
          href: '/ai-services/ai-real-estate-software',
          title: 'AI Real Estate Software',
          text: 'Listing, lead and document workflows automated for property businesses.',
        },
        {
          href: '/ai-services/ai-education-edtech',
          title: 'AI Education / EdTech',
          text: 'Adaptive learning, assessment and teaching tools for education providers.',
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
