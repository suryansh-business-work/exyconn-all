/**
 * Defaults of the company-area section components: the about page's copy (and the vision
 * and services pages' for the sections the about page does not use). Every page that places
 * these sections seeds its own props (exyconn-portal/server/src/modules/cms/seed).
 */

export const COMPANY_STAGE_PROPS = {
  family: 'company',
  variant: 'hero',
  crumbs: [
    {
      label: 'Home',
      href: '/',
    },
    {
      label: 'About us',
      href: '',
    },
  ],
  title: 'Building the future of AI and SaaS',
  lede: "We're a team of passionate technologists, strategists, and innovators dedicated to helping businesses thrive in the digital era through AI, automation, and digital expertise.",
  primary: {
    label: 'Work with us',
    href: '/contact',
    external: false,
  },
  secondary: {
    label: 'Our vision',
    href: '/our-vision',
    external: false,
  },
  scene: {
    shapes: ['globe'],
    data: {},
  },
  globeFromMarkets: true,
};

export const COMPANY_STATS_PROPS = {
  label: 'Exyconn at a glance',
  items: [
    {
      value: '2022',
      label: 'Founded',
    },
    {
      value: '15+',
      label: 'Team members',
    },
    {
      value: '50+',
      label: 'Projects delivered',
    },
    {
      value: '100%',
      label: 'Client satisfaction',
    },
  ],
};

export const COMPANY_CHAPTER_PROPS = {
  index: 1,
  id: 'thesis',
  label: 'Why we exist',
  title: 'Technology that moves a business forward',
  lede: '',
};

export const COMPANY_INFO_GRID_PROPS = {
  items: [
    {
      title: 'Our mission',
      text: 'To empower organizations with innovative technology, creativity, and expertise—enabling them to achieve their full potential and stay ahead in a rapidly evolving world.',
      points: [],
      link: {
        label: '',
        href: '',
      },
    },
    {
      title: 'Our vision',
      text: 'To be a global leader in AI-driven transformation, enabling smarter, faster, and more efficient business outcomes for our clients worldwide.',
      points: [],
      link: {
        label: '',
        href: '',
      },
    },
  ],
  columns: 2,
  indexPrefix: '',
};

export const COMPANY_LINK_CARDS_PROPS = {
  layout: 'work',
  indexPrefix: 'W',
  more: 'Explore',
  items: [
    {
      title: 'AI agents & automation',
      text: 'Autonomous agents that perceive, decide and act to achieve business goals, around the clock.',
      href: '/ai/agentic',
    },
    {
      title: 'SaaS & custom software',
      text: 'Scalable, secure and innovative SaaS, designed, built and managed.',
      href: '/services/software-as-a-service',
    },
    {
      title: 'Digital consulting & strategy',
      text: 'Accelerate your digital transformation with strategy and technology consulting.',
      href: '/services/digital-consulting',
    },
    {
      title: 'Data analytics & integration',
      text: 'Turn your data into actionable insights for smarter decisions.',
      href: '/services/data-analytics',
    },
    {
      title: 'Ongoing support & optimization',
      text: 'Keep your applications running smoothly with proactive support.',
      href: '/services/maintenance',
    },
  ],
};

export const COMPANY_BELIEFS_PROPS = {
  items: [
    {
      title: 'Innovation',
      text: 'We embrace new ideas and technologies to deliver cutting-edge solutions.',
    },
    {
      title: 'Collaboration',
      text: 'We believe in strong partnerships and teamwork with our clients.',
    },
    {
      title: 'Integrity',
      text: 'We act with honesty, transparency, and ethical business practices.',
    },
    {
      title: 'Excellence',
      text: 'We strive for the highest quality in everything we create.',
    },
  ],
};

export const COMPANY_MARKET_REACH_PROPS = {
  labels: {
    markets: 'Markets',
    countries: 'Countries',
    languages: 'Languages',
  },
  text: 'As a remote-first company, we collaborate with clients globally — this site is published for {markets} markets in {countries} countries and {languages} languages.',
  caption: 'Each arc on the globe joins two markets that read the site in the same language.',
};

export const COMPANY_STATEMENT_PROPS = {
  paragraphs: [
    'As technology evolves, so does our commitment to responsible innovation. Join us on this journey to build a smarter, more connected, and more human world.',
  ],
  points: [
    'Continuous learning — we foster a culture of innovation and knowledge sharing.',
    'Accessible, secure and beneficial AI for everyone.',
    'Technology that serves humanity.',
  ],
};

export const COMPANY_HORIZONS_PROPS = {
  horizons: [
    {
      when: 'Now',
      title: 'Accelerate innovation',
      text: 'Help businesses adopt AI faster and more effectively.',
    },
    {
      when: 'Next',
      title: 'Global reach',
      text: 'Make AI accessible to organizations of all sizes worldwide.',
    },
    {
      when: 'Later',
      title: 'Positive impact',
      text: 'Create technology that benefits businesses and society.',
    },
  ],
};

export const COMPANY_CTA_PROPS = {
  family: 'company',
  title: 'Ready to transform your business with AI?',
  text: 'Partner with Exyconn to unlock the power of AI automation, intelligent agents, and enterprise SaaS.',
  primary: {
    label: 'Schedule a consultation',
    href: '/contact',
    external: false,
  },
  secondary: {
    label: '',
    href: '',
    external: false,
  },
};

export const COMPANY_RELATED_HUBS_PROPS = {
  index: 3,
  label: 'Explore',
  title: 'More ways to see what we do',
  links: [
    {
      href: '/services',
      title: 'Services hub',
      text: 'Every service by pillar — build, modernise and grow.',
      more: 'Browse services',
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
    {
      href: '/ai-services',
      title: 'AI services catalogue',
      text: 'Every AI product and build service we offer, by capability area.',
      more: 'Open the catalogue',
    },
  ],
};

export const COMPANY_LINK_ROWS_PROPS = {
  groups: [
    {
      title: 'Artificial intelligence',
      services: [
        {
          title: 'Agentic AI',
          text: 'Autonomous agents for business automation and decision-making.',
          href: '/ai/agentic',
        },
        {
          title: 'Bot creation',
          text: 'Conversational and workflow bots for support and engagement.',
          href: '/ai/bot-creation',
        },
        {
          title: 'AI workflows',
          text: 'Automate complex business processes with AI-driven workflows.',
          href: '/ai/workflows',
        },
        {
          title: 'LLM solutions',
          text: 'Large language models for advanced text and data solutions.',
          href: '/ai/llms',
        },
        {
          title: 'Custom AI training',
          text: 'Tailored AI models trained on your unique business data.',
          href: '/ai/custom-model-training',
        },
      ],
    },
    {
      title: 'Software, data & support',
      services: [
        {
          title: 'SaaS development',
          text: 'Custom cloud software with scalability and security built in.',
          href: '/services/software-as-a-service',
        },
        {
          title: 'Data analytics',
          text: 'Transform data into actionable insights with AI-powered analytics.',
          href: '/services/data-analytics',
        },
        {
          title: 'Integration services',
          text: 'Connect your systems with seamless API and data integration.',
          href: '/services/automation-integration',
        },
        {
          title: 'Managed support',
          text: 'Round-the-clock monitoring, maintenance and optimization.',
          href: '/services/maintenance',
        },
      ],
    },
  ],
};
