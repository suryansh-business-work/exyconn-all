/**
 * The home page's words as they were before the CMS: the default props of the home
 * components, and the props exyconn.com's seeded home page starts with. `{serviceCount}` is
 * filled in by the website with the number of AI services it lists.
 */

export const HOME_STAGE_PROPS = {
  railLabel: 'Page sections',
  chapters: [
    { id: 'intro', label: 'AI Products & Services' },
    { id: 'solutions', label: 'What We Offer' },
    { id: 'industries', label: 'Industry Solutions' },
    { id: 'partner', label: 'The AI-First Technology Partner' },
    { id: 'start', label: 'Start Your Project' },
  ],
};

export const HOME_HERO_PROPS = {
  id: 'intro',
  badge: 'AI Products & Services',
  headline: 'AI That Does the Work.',
  headlineSecond: 'Not Just the Talking.',
  lead: 'We build AI agents, automation and vertical AI products that run real operations — sales, support, finance, hiring and logistics — across {serviceCount} service areas, on the systems you already use.',
  actions: [
    { label: 'Explore AI Services', href: '/ai-services', icon: 'fa-bolt', external: false },
    { label: 'Free Tools', href: 'https://tools.exyconn.com', icon: 'fa-toolbox', external: true },
  ],
  stats: [
    { value: '1 Week', label: 'Launch Time' },
    { value: '60%', label: 'Cost Savings' },
    { value: '99.9%', label: 'Uptime' },
  ],
  features: [
    {
      icon: 'fa-robot',
      title: 'AI Agents',
      text: 'Autonomous systems that work 24/7, handling tasks intelligently.',
    },
    {
      icon: 'fa-shield-halved',
      title: 'Authentication',
      text: 'Complete auth with OAuth 2.0, MFA, and RBAC support.',
    },
    {
      icon: 'fa-cube',
      title: 'SaaS Products',
      text: 'Full-featured B2B and B2B2C platforms ready to deploy.',
    },
    {
      icon: 'fa-code',
      title: 'Developer Tools',
      text: 'APIs, SDKs, and infrastructure tools for rapid development.',
    },
  ],
  scrollHint: 'Scroll to explore',
};

export const HOME_SOLUTIONS_PROPS = {
  id: 'solutions',
  badge: 'What We Offer',
  title: 'Solutions for',
  accent: 'Modern Business',
  lead: 'From idea to MVP in one week. We handle the infrastructure, you focus on building value.',
  pillars: [
    {
      href: '/ai-services',
      icon: 'fa-bolt',
      flag: 'FEATURED',
      title: 'AI Services',
      text: '{serviceCount} service areas across agents, automation, vertical AI products and the platform underneath them — delivered on the systems you already run.',
      points: [
        'Agents & Automation',
        'Revenue & Growth',
        'Industry Platforms',
        'Business Operations',
      ],
      cta: 'Learn More',
    },
    {
      href: '/ai',
      icon: 'fa-microchip',
      flag: '',
      title: 'AI Platform',
      text: 'Deploy production-ready AI agents, workflows, and LLM-powered applications with enterprise security.',
      points: [
        'Agentic AI & Autonomous Agents',
        'Custom LLM Training',
        'AI Workflow Orchestration',
        'MCP Server Infrastructure',
      ],
      cta: 'Explore AI Platform',
    },
  ],
  quickLinks: [
    { href: '/ai/agentic', icon: 'fa-robot', title: 'Agentic AI', text: 'Autonomous agents' },
    {
      href: '/ai/workflows',
      icon: 'fa-diagram-project',
      title: 'Workflows',
      text: 'Process automation',
    },
    {
      href: '/services/digital-consulting',
      icon: 'fa-lightbulb',
      title: 'Consulting',
      text: 'Digital strategy',
    },
    {
      href: '/services/data-analytics',
      icon: 'fa-chart-line',
      title: 'Analytics',
      text: 'Data insights',
    },
  ],
  catalogue: {
    badge: 'AI Services',
    title: '{serviceCount} Ways We Put',
    accent: 'AI to Work',
    lead: 'Agents that carry out real work, vertical AI products for a single industry, and the platform layer underneath — built on the systems you already run.',
    ctaLabel: 'Browse all AI services',
    ctaHref: '/ai-services',
  },
};
