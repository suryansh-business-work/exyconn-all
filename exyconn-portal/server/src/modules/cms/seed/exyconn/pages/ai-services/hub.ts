import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/ai-services (formerly exyconn-website/src/pages/[market]/ai-services/index.astro). */
export const AI_SERVICES_HUB_PAGE: CmsSeedPage = {
  key: 'ai-services',
  path: '/ai-services',
  kind: 'PAGE',
  title: 'AI Services | {serviceCount} AI Products & Build Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI Services | {serviceCount} AI Products & Build Services | Exyconn',
    description:
      'Exyconn is an AI product and services company. {serviceCount} AI services across {categoryCount} categories — agents and automation, revenue systems, industry platforms, business operations, AI infrastructure, and governance.',
    keywords:
      'AI services, AI product company, AI development company, AI agents, AI Agents for SMBs, AI Workflow Automation, AI Voice Agents, AI WhatsApp Automation, AI Document Processing, AI Personal Assistant, AI Sales Automation, AI Customer Support, AI Marketing Automation, AI E-commerce Automation, Agentic Commerce, Vertical AI SaaS, AI Healthcare Software, AI Real Estate Software, AI Education / EdTech, AI Logistics & Supply Chain, AI SaaS for Local Businesses, AI HR & Recruitment, AI Recruitment Marketplace, AI Finance & Accounting, AI Compliance Automation, AI RAG Platform, AI Knowledge Management, AI Data & Analytics, AI API / Infrastructure, AI Observability, AI Developer Tools, AI Cybersecurity, AI Governance & Guardrails',
    ogImageUrl: '',
    canonical: 'https://exyconn.com/ai-services',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Exyconn AI Services',
        description:
          'Exyconn is an AI product and services company. {serviceCount} AI services across {categoryCount} categories — agents and automation, revenue systems, industry platforms, business operations, AI infrastructure, and governance.',
        url: 'https://exyconn.com/ai-services',
        numberOfItems: 29,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'AI Agents for SMBs',
            description:
              'Production AI agents sized and priced for small and mid-sized businesses.',
            url: 'https://exyconn.com/ai-services/ai-agents-for-smbs',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI Workflow Automation',
            description:
              'End-to-end processes automated across the systems that already run your business.',
            url: 'https://exyconn.com/ai-services/ai-workflow-automation',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'AI Voice Agents',
            description: 'Voice agents that book, qualify and answer on live calls.',
            url: 'https://exyconn.com/ai-services/ai-voice-agents',
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI WhatsApp Automation',
            description: 'Sales and support on WhatsApp, automated on the official Business API.',
            url: 'https://exyconn.com/ai-services/ai-whatsapp-automation',
          },
          {
            '@type': 'ListItem',
            position: 5,
            name: 'AI Document Processing',
            description: 'Invoices, contracts and forms turned into structured data you can trust.',
            url: 'https://exyconn.com/ai-services/ai-document-processing',
          },
          {
            '@type': 'ListItem',
            position: 6,
            name: 'AI Personal Assistant',
            description:
              'An assistant across inbox, calendar and notes that knows your business context.',
            url: 'https://exyconn.com/ai-services/ai-personal-assistant',
          },
          {
            '@type': 'ListItem',
            position: 7,
            name: 'AI Sales Automation',
            description:
              'Research, outreach and follow-up handled so reps spend their time in conversations.',
            url: 'https://exyconn.com/ai-services/ai-sales-automation',
          },
          {
            '@type': 'ListItem',
            position: 8,
            name: 'AI Customer Support',
            description: 'Deflect the repetitive tickets and hand the rest over with full context.',
            url: 'https://exyconn.com/ai-services/ai-customer-support',
          },
          {
            '@type': 'ListItem',
            position: 9,
            name: 'AI Marketing Automation',
            description:
              'Campaign production and personalisation at a volume a small team cannot reach manually.',
            url: 'https://exyconn.com/ai-services/ai-marketing-automation',
          },
          {
            '@type': 'ListItem',
            position: 10,
            name: 'AI E-commerce Automation',
            description:
              'Catalogue, merchandising and post-purchase messaging automated across your storefront.',
            url: 'https://exyconn.com/ai-services/ai-ecommerce-automation',
          },
          {
            '@type': 'ListItem',
            position: 11,
            name: 'Agentic Commerce',
            description:
              'Make your catalogue and checkout usable by AI agents that buy on a customer’s behalf.',
            url: 'https://exyconn.com/ai-services/agentic-commerce',
          },
          {
            '@type': 'ListItem',
            position: 12,
            name: 'Vertical AI SaaS',
            description: 'A complete AI SaaS product built for one industry — from idea to launch.',
            url: 'https://exyconn.com/ai-services/vertical-ai-saas',
          },
          {
            '@type': 'ListItem',
            position: 13,
            name: 'AI Healthcare Software',
            description:
              'Clinical and administrative AI built to the handling rules healthcare requires.',
            url: 'https://exyconn.com/ai-services/ai-healthcare-software',
          },
          {
            '@type': 'ListItem',
            position: 14,
            name: 'AI Real Estate Software',
            description: 'Listing, lead and document workflows automated for property businesses.',
            url: 'https://exyconn.com/ai-services/ai-real-estate-software',
          },
          {
            '@type': 'ListItem',
            position: 15,
            name: 'AI Education / EdTech',
            description:
              'Adaptive learning, assessment and teaching tools for education providers.',
            url: 'https://exyconn.com/ai-services/ai-education-edtech',
          },
          {
            '@type': 'ListItem',
            position: 16,
            name: 'AI Logistics & Supply Chain',
            description: 'Forecasting, routing and exception handling across your supply chain.',
            url: 'https://exyconn.com/ai-services/ai-logistics-supply-chain',
          },
          {
            '@type': 'ListItem',
            position: 17,
            name: 'AI SaaS for Local Businesses',
            description:
              'Bookings, reviews and customer messaging automated for businesses with a physical presence.',
            url: 'https://exyconn.com/ai-services/ai-saas-for-local-businesses',
          },
          {
            '@type': 'ListItem',
            position: 18,
            name: 'AI HR & Recruitment',
            description:
              'Screening, scheduling and onboarding automated with bias controls built in.',
            url: 'https://exyconn.com/ai-services/ai-hr-recruitment',
          },
          {
            '@type': 'ListItem',
            position: 19,
            name: 'AI Recruitment Marketplace',
            description: 'Two-sided hiring platforms with matching that improves as they are used.',
            url: 'https://exyconn.com/ai-services/ai-recruitment-marketplace',
          },
          {
            '@type': 'ListItem',
            position: 20,
            name: 'AI Finance & Accounting',
            description:
              'Reconciliation, payables and reporting automated with the audit trail intact.',
            url: 'https://exyconn.com/ai-services/ai-finance-accounting',
          },
          {
            '@type': 'ListItem',
            position: 21,
            name: 'AI Compliance Automation',
            description:
              'Evidence collection and control monitoring kept current instead of rebuilt each audit.',
            url: 'https://exyconn.com/ai-services/ai-compliance-automation',
          },
          {
            '@type': 'ListItem',
            position: 22,
            name: 'AI RAG Platform',
            description: 'Retrieval that grounds answers in your own content, with citations.',
            url: 'https://exyconn.com/ai-services/ai-rag-platform',
          },
          {
            '@type': 'ListItem',
            position: 23,
            name: 'AI Knowledge Management',
            description: 'Scattered institutional knowledge made searchable and kept current.',
            url: 'https://exyconn.com/ai-services/ai-knowledge-management',
          },
          {
            '@type': 'ListItem',
            position: 24,
            name: 'AI Data & Analytics',
            description:
              'Pipelines and analysis that make your data usable for AI in the first place.',
            url: 'https://exyconn.com/ai-services/ai-data-analytics',
          },
          {
            '@type': 'ListItem',
            position: 25,
            name: 'AI API / Infrastructure',
            description:
              'The serving layer behind your AI features — routing, caching and cost control.',
            url: 'https://exyconn.com/ai-services/ai-api-infrastructure',
          },
          {
            '@type': 'ListItem',
            position: 26,
            name: 'AI Observability',
            description:
              'See what your AI actually did, what it cost and where quality is slipping.',
            url: 'https://exyconn.com/ai-services/ai-observability',
          },
          {
            '@type': 'ListItem',
            position: 27,
            name: 'AI Developer Tools',
            description: 'Internal tooling that makes your own engineers measurably faster.',
            url: 'https://exyconn.com/ai-services/ai-developer-tools',
          },
          {
            '@type': 'ListItem',
            position: 28,
            name: 'AI Cybersecurity',
            description:
              'Detection and response strengthened with AI — including securing your AI itself.',
            url: 'https://exyconn.com/ai-services/ai-cybersecurity',
          },
          {
            '@type': 'ListItem',
            position: 29,
            name: 'AI Governance & Guardrails',
            description:
              'Policy, controls and evidence that keep AI defensible as regulation tightens.',
            url: 'https://exyconn.com/ai-services/ai-governance-guardrails',
          },
        ],
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
          href: '',
        },
      ],
      title: 'AI that ships working systems, not pilots',
      lede: 'Exyconn builds AI products and runs the services around them — agents that do real work, the platforms they run on, and the guardrails that keep them defensible in front of your customers.',
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      secondary: {
        label: 'Talk to an engineer',
        href: '/contact',
      },
      scene: {
        shapes: ['neuralCore'],
        data: {
          neuralCore: {
            modules: 6,
          },
        },
      },
      glyph: '',
      tagline: '',
    }),
    place('detail.proof', {
      label: 'The catalogue at a glance',
      items: [
        {
          value: '{serviceCount}',
          label: 'AI services',
        },
        {
          value: '{categoryCount}',
          label: 'Capability areas',
        },
      ],
    }),
    place('aiservice.catalogue', {
      index: 1,
      id: 'catalogue',
      label: 'Catalogue',
      title: 'Every AI service, by capability area',
      copy: {
        filterLabel: 'Filter AI services',
        sheetLabel: 'Categories',
        chipsLabel: 'Category',
        allLabel: 'All',
        searchLabel: 'Search',
        searchPlaceholder: 'Search AI services',
        countTemplate: '{shown} of {total} services',
        empty: 'No AI service matches that search. Clear the filters to see all of them.',
        more: 'Explore service',
        serviceOne: 'service',
        serviceMany: 'services',
      },
      categories: [
        {
          slug: 'agents-automation',
          title: 'Agents & Automation',
          description:
            'Agents that carry out real work across your tools, not chatbots that only answer questions.',
          icon: 'fa-robot',
          services: [
            {
              slug: 'ai-agents-for-smbs',
              title: 'AI Agents for SMBs',
              summary: 'Production AI agents sized and priced for small and mid-sized businesses.',
              icon: 'fa-robot',
            },
            {
              slug: 'ai-workflow-automation',
              title: 'AI Workflow Automation',
              summary:
                'End-to-end processes automated across the systems that already run your business.',
              icon: 'fa-diagram-project',
            },
            {
              slug: 'ai-voice-agents',
              title: 'AI Voice Agents',
              summary: 'Voice agents that book, qualify and answer on live calls.',
              icon: 'fa-phone-volume',
            },
            {
              slug: 'ai-whatsapp-automation',
              title: 'AI WhatsApp Automation',
              summary: 'Sales and support on WhatsApp, automated on the official Business API.',
              icon: 'fa-comment-dots',
            },
            {
              slug: 'ai-document-processing',
              title: 'AI Document Processing',
              summary: 'Invoices, contracts and forms turned into structured data you can trust.',
              icon: 'fa-file-invoice',
            },
            {
              slug: 'ai-personal-assistant',
              title: 'AI Personal Assistant',
              summary:
                'An assistant across inbox, calendar and notes that knows your business context.',
              icon: 'fa-user-astronaut',
            },
          ],
        },
        {
          slug: 'revenue-growth',
          title: 'Revenue & Growth',
          description:
            'AI on the commercial front line — pipeline, campaigns, support and checkout.',
          icon: 'fa-chart-line',
          services: [
            {
              slug: 'ai-sales-automation',
              title: 'AI Sales Automation',
              summary:
                'Research, outreach and follow-up handled so reps spend their time in conversations.',
              icon: 'fa-bullseye',
            },
            {
              slug: 'ai-customer-support',
              title: 'AI Customer Support',
              summary: 'Deflect the repetitive tickets and hand the rest over with full context.',
              icon: 'fa-headset',
            },
            {
              slug: 'ai-marketing-automation',
              title: 'AI Marketing Automation',
              summary:
                'Campaign production and personalisation at a volume a small team cannot reach manually.',
              icon: 'fa-bullhorn',
            },
            {
              slug: 'ai-ecommerce-automation',
              title: 'AI E-commerce Automation',
              summary:
                'Catalogue, merchandising and post-purchase messaging automated across your storefront.',
              icon: 'fa-cart-shopping',
            },
            {
              slug: 'agentic-commerce',
              title: 'Agentic Commerce',
              summary:
                'Make your catalogue and checkout usable by AI agents that buy on a customer’s behalf.',
              icon: 'fa-robot',
            },
          ],
        },
        {
          slug: 'vertical-platforms',
          title: 'Industry Platforms',
          description: 'Vertical AI software shaped around how one industry actually operates.',
          icon: 'fa-layer-group',
          services: [
            {
              slug: 'vertical-ai-saas',
              title: 'Vertical AI SaaS',
              summary: 'A complete AI SaaS product built for one industry — from idea to launch.',
              icon: 'fa-layer-group',
            },
            {
              slug: 'ai-healthcare-software',
              title: 'AI Healthcare Software',
              summary:
                'Clinical and administrative AI built to the handling rules healthcare requires.',
              icon: 'fa-heart-pulse',
            },
            {
              slug: 'ai-real-estate-software',
              title: 'AI Real Estate Software',
              summary: 'Listing, lead and document workflows automated for property businesses.',
              icon: 'fa-building',
            },
            {
              slug: 'ai-education-edtech',
              title: 'AI Education / EdTech',
              summary: 'Adaptive learning, assessment and teaching tools for education providers.',
              icon: 'fa-graduation-cap',
            },
            {
              slug: 'ai-logistics-supply-chain',
              title: 'AI Logistics & Supply Chain',
              summary: 'Forecasting, routing and exception handling across your supply chain.',
              icon: 'fa-truck-fast',
            },
            {
              slug: 'ai-saas-for-local-businesses',
              title: 'AI SaaS for Local Businesses',
              summary:
                'Bookings, reviews and customer messaging automated for businesses with a physical presence.',
              icon: 'fa-store',
            },
          ],
        },
        {
          slug: 'business-operations',
          title: 'Business Operations',
          description:
            'The back office — hiring, finance and compliance — with the manual passes removed.',
          icon: 'fa-briefcase',
          services: [
            {
              slug: 'ai-hr-recruitment',
              title: 'AI HR & Recruitment',
              summary:
                'Screening, scheduling and onboarding automated with bias controls built in.',
              icon: 'fa-users',
            },
            {
              slug: 'ai-recruitment-marketplace',
              title: 'AI Recruitment Marketplace',
              summary: 'Two-sided hiring platforms with matching that improves as they are used.',
              icon: 'fa-handshake',
            },
            {
              slug: 'ai-finance-accounting',
              title: 'AI Finance & Accounting',
              summary:
                'Reconciliation, payables and reporting automated with the audit trail intact.',
              icon: 'fa-calculator',
            },
            {
              slug: 'ai-compliance-automation',
              title: 'AI Compliance Automation',
              summary:
                'Evidence collection and control monitoring kept current instead of rebuilt each audit.',
              icon: 'fa-clipboard-check',
            },
          ],
        },
        {
          slug: 'platform-infrastructure',
          title: 'Platform & Infrastructure',
          description:
            'The layer your AI features are built on: retrieval, data, APIs and observability.',
          icon: 'fa-server',
          services: [
            {
              slug: 'ai-rag-platform',
              title: 'AI RAG Platform',
              summary: 'Retrieval that grounds answers in your own content, with citations.',
              icon: 'fa-magnifying-glass-chart',
            },
            {
              slug: 'ai-knowledge-management',
              title: 'AI Knowledge Management',
              summary: 'Scattered institutional knowledge made searchable and kept current.',
              icon: 'fa-book-open',
            },
            {
              slug: 'ai-data-analytics',
              title: 'AI Data & Analytics',
              summary:
                'Pipelines and analysis that make your data usable for AI in the first place.',
              icon: 'fa-chart-column',
            },
            {
              slug: 'ai-api-infrastructure',
              title: 'AI API / Infrastructure',
              summary:
                'The serving layer behind your AI features — routing, caching and cost control.',
              icon: 'fa-server',
            },
            {
              slug: 'ai-observability',
              title: 'AI Observability',
              summary: 'See what your AI actually did, what it cost and where quality is slipping.',
              icon: 'fa-gauge-high',
            },
            {
              slug: 'ai-developer-tools',
              title: 'AI Developer Tools',
              summary: 'Internal tooling that makes your own engineers measurably faster.',
              icon: 'fa-code',
            },
          ],
        },
        {
          slug: 'trust-security',
          title: 'Trust & Security',
          description:
            'Keeping AI systems defensible — controlled, monitored and safe to put in front of customers.',
          icon: 'fa-shield-halved',
          services: [
            {
              slug: 'ai-cybersecurity',
              title: 'AI Cybersecurity',
              summary:
                'Detection and response strengthened with AI — including securing your AI itself.',
              icon: 'fa-shield-halved',
            },
            {
              slug: 'ai-governance-guardrails',
              title: 'AI Governance & Guardrails',
              summary:
                'Policy, controls and evidence that keep AI defensible as regulation tightens.',
              icon: 'fa-scale-balanced',
            },
          ],
        },
      ],
    }),
    place('service.related-hubs', {
      index: 2,
      label: 'Explore',
      title: 'AI, services and the platform',
      links: [
        {
          href: '/services',
          title: 'Services hub',
          text: 'Every service by pillar — build, modernise and grow.',
          more: 'Browse services',
        },
        {
          href: '/our-services',
          title: 'Our service pillars',
          text: 'AI platform services, SaaS development and enterprise consulting.',
          more: 'See the pillars',
        },
        {
          href: '/exyconn-services',
          title: 'Infrastructure platform',
          text: 'Email, payments, logs, themes, translations and more — all in one place.',
          more: 'See the platform',
        },
        {
          href: '/ai',
          title: 'AI platform',
          text: 'Agents, models, workflows and MCP infrastructure, production-ready.',
          more: 'Explore AI',
        },
      ],
      featured: {
        href: '',
        title: '',
        text: '',
        more: '',
      },
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
        label: 'Book a consultation',
        href: '/contact',
      },
      echoShape: 0,
    }),
  ].join(''),
  css: '',
};
