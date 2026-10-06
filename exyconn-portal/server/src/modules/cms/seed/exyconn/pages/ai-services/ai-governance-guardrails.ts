import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-governance-guardrails (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_GOVERNANCE_GUARDRAILS_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-governance-guardrails',
  path: '/ai-services/ai-governance-guardrails',
  kind: 'PAGE',
  title: 'AI Governance & Guardrails | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Governance & Guardrails | AI Services | Exyconn',
    description: 'Policy, controls and evidence that keep AI defensible as regulation tightens.',
    keywords: 'AI Governance & Guardrails, Trust & Security, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-governance-guardrails',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Governance & Guardrails',
        description:
          'The controls that make AI safe to put in front of customers and regulators: input and output guardrails, approval boundaries, model inventories and decision records. Built to the emerging obligations rather than after them.',
        url: 'https://exyconn.com/ai-services/ai-governance-guardrails',
        serviceType: 'Trust & Security',
        category: 'Trust & Security',
        areaServed: 'Worldwide',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'AI Governance & Guardrails deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Guardrails on inputs, outputs and tool use',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Approval boundaries for consequential actions',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'A model and use-case inventory with owners',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Decision records that stand up to scrutiny',
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
            name: 'Trust & Security',
            item: 'https://exyconn.com/ai-services?cat=trust-security',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI Governance & Guardrails',
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
          label: 'Trust & Security',
          href: '/ai-services?cat=trust-security',
        },
        {
          label: 'AI Governance & Guardrails',
          href: '',
        },
      ],
      title: 'AI Governance & Guardrails',
      lede: 'Policy, controls and evidence that keep AI defensible as regulation tightens.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to us',
        href: '/contact',
      },
      scene: {
        shapes: ['shield'],
      },
      glyph: '',
      tagline: '',
    }),
    place('aiservice.approach', {
      index: 1,
      label: 'Approach',
      title: 'How we approach it',
      description:
        'The controls that make AI safe to put in front of customers and regulators: input and output guardrails, approval boundaries, model inventories and decision records. Built to the emerging obligations rather than after them.',
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
        title: 'Trust & Security',
        description:
          'Keeping AI systems defensible — controlled, monitored and safe to put in front of customers.',
        href: '/ai-services?cat=trust-security',
        link: 'See the whole category',
      },
    }),
    place('aiservice.outcomes', {
      index: 2,
      label: 'Deliverables',
      title: 'What you get',
      outcomes: [
        'Guardrails on inputs, outputs and tool use',
        'Approval boundaries for consequential actions',
        'A model and use-case inventory with owners',
        'Decision records that stand up to scrutiny',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Trust & Security',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-cybersecurity',
          title: 'AI Cybersecurity',
          text: 'Detection and response strengthened with AI — including securing your AI itself.',
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
