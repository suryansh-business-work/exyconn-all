import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-education-edtech (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_EDUCATION_EDTECH_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-education-edtech',
  path: '/ai-services/ai-education-edtech',
  kind: 'PAGE',
  title: 'AI Education / EdTech | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Education / EdTech | AI Services | Exyconn',
    description: 'Adaptive learning, assessment and teaching tools for education providers.',
    keywords: 'AI Education / EdTech, Industry Platforms, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-education-edtech',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Education / EdTech',
        description:
          'Content generation, adaptive practice and assessment support for institutions and EdTech products. Designed so teaching staff keep oversight of what learners are shown and how their work is judged.',
        url: 'https://exyconn.com/ai-services/ai-education-edtech',
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
          name: 'AI Education / EdTech deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Course material and practice generated to a syllabus',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Difficulty adapted to individual learner progress',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Assessment support with educator review',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Progress analytics for teaching teams',
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
            name: 'AI Education / EdTech',
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
          label: 'AI Education / EdTech',
          href: '',
        },
      ],
      title: 'AI Education / EdTech',
      lede: 'Adaptive learning, assessment and teaching tools for education providers.',
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
        'Content generation, adaptive practice and assessment support for institutions and EdTech products. Designed so teaching staff keep oversight of what learners are shown and how their work is judged.',
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
        'Course material and practice generated to a syllabus',
        'Difficulty adapted to individual learner progress',
        'Assessment support with educator review',
        'Progress analytics for teaching teams',
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
