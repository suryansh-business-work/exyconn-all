/**
 * The AI service catalogue's sections (/ai-services, /ai-services/<slug>): the words of the first page that uses each, as they were before the CMS.
 */

export const AISERVICE_CATALOGUE_PROPS = {
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
      description: 'AI on the commercial front line — pipeline, campaigns, support and checkout.',
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
          summary: 'Screening, scheduling and onboarding automated with bias controls built in.',
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
          summary: 'Reconciliation, payables and reporting automated with the audit trail intact.',
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
          summary: 'Pipelines and analysis that make your data usable for AI in the first place.',
          icon: 'fa-chart-column',
        },
        {
          slug: 'ai-api-infrastructure',
          title: 'AI API / Infrastructure',
          summary: 'The serving layer behind your AI features — routing, caching and cost control.',
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
          summary: 'Policy, controls and evidence that keep AI defensible as regulation tightens.',
          icon: 'fa-scale-balanced',
        },
      ],
    },
  ],
};

export const AISERVICE_APPROACH_PROPS = {
  index: 1,
  label: 'Approach',
  title: 'How we approach it',
  description:
    'Most AI agent projects are scoped for enterprises with a team to run them. We build agents a small business can actually operate: connected to the tools you already use, with clear limits on what they may do on their own. You get a working agent handling a real task, not a pilot that stalls after the demo.',
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
    title: 'Agents & Automation',
    description:
      'Agents that carry out real work across your tools, not chatbots that only answer questions.',
    href: '/ai-services?cat=agents-automation',
    link: 'See the whole category',
  },
};

export const AISERVICE_OUTCOMES_PROPS = {
  index: 2,
  label: 'Deliverables',
  title: 'What you get',
  outcomes: [
    'An agent live on one high-volume task within weeks',
    'Connected to your existing CRM, inbox and spreadsheets',
    'Explicit approval steps wherever money or customers are involved',
    'Handover documentation so your team can adjust it without us',
  ],
};

export const AISERVICE_RELATED_PROPS = {
  index: 3,
  label: 'Related',
  title: 'More in Agents & Automation',
  more: 'Explore service',
  services: [
    {
      href: '/ai-services/ai-workflow-automation',
      title: 'AI Workflow Automation',
      text: 'End-to-end processes automated across the systems that already run your business.',
    },
    {
      href: '/ai-services/ai-voice-agents',
      title: 'AI Voice Agents',
      text: 'Voice agents that book, qualify and answer on live calls.',
    },
    {
      href: '/ai-services/ai-whatsapp-automation',
      title: 'AI WhatsApp Automation',
      text: 'Sales and support on WhatsApp, automated on the official Business API.',
    },
  ],
};
