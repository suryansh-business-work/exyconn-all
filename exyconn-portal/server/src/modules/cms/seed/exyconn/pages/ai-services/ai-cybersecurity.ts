import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/**
 * exyconn.com/ai-services/ai-cybersecurity (formerly the [slug].astro template
 * of exyconn-website/src/pages/[market]/ai-services over lib/services/aiServices.ts).
 */
export const AI_SERVICES_AI_CYBERSECURITY_PAGE: CmsSeedPage = {
  key: 'ai-services-ai-cybersecurity',
  path: '/ai-services/ai-cybersecurity',
  kind: 'PAGE',
  title: 'AI Cybersecurity | AI Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Cybersecurity | AI Services | Exyconn',
    description: 'Detection and response strengthened with AI — including securing your AI itself.',
    keywords: 'AI Cybersecurity, Trust & Security, AI services, Exyconn',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services/ai-cybersecurity',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Cybersecurity',
        description:
          'Two halves: using AI to improve detection, triage and response, and securing the AI systems you are deploying against prompt injection, data exfiltration and model abuse. The second half is routinely skipped.',
        url: 'https://exyconn.com/ai-services/ai-cybersecurity',
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
          name: 'AI Cybersecurity deliverables',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Alert triage and enrichment automated',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Anomaly detection tuned to your environment',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'AI systems tested against prompt injection and abuse',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Response runbooks with automated first steps',
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
            name: 'AI Cybersecurity',
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
          label: 'AI Cybersecurity',
          href: '',
        },
      ],
      title: 'AI Cybersecurity',
      lede: 'Detection and response strengthened with AI — including securing your AI itself.',
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
        'Two halves: using AI to improve detection, triage and response, and securing the AI systems you are deploying against prompt injection, data exfiltration and model abuse. The second half is routinely skipped.',
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
        'Alert triage and enrichment automated',
        'Anomaly detection tuned to your environment',
        'AI systems tested against prompt injection and abuse',
        'Response runbooks with automated first steps',
      ],
    }),
    place('aiservice.related', {
      index: 3,
      label: 'Related',
      title: 'More in Trust & Security',
      more: 'Explore service',
      services: [
        {
          href: '/ai-services/ai-governance-guardrails',
          title: 'AI Governance & Guardrails',
          text: 'Policy, controls and evidence that keep AI defensible as regulation tightens.',
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
