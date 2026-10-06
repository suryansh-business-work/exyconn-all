/** The home page's later chapters, as they were before the CMS (see home.copy.ts). */

export const HOME_INDUSTRIES_PROPS = {
  id: 'industries',
  badge: 'Industry Solutions',
  title: 'AI + SaaS for',
  accent: 'Every Industry',
  lead: 'We deliver tailored AI and software solutions across diverse sectors, helping businesses transform their operations and stay ahead of the competition.',
  industries: [
    {
      icon: 'fa-hospital',
      title: 'Healthcare',
      text: 'HIPAA-compliant AI solutions for patient care, diagnostics, and medical workflows.',
    },
    {
      icon: 'fa-landmark',
      title: 'Finance & Banking',
      text: 'Secure fintech solutions with fraud detection, risk analysis, and compliance automation.',
    },
    {
      icon: 'fa-shopping-cart',
      title: 'Retail & E-commerce',
      text: 'Personalized shopping experiences, inventory management, and customer analytics.',
    },
    {
      icon: 'fa-industry',
      title: 'Manufacturing',
      text: 'Smart factory solutions with predictive maintenance and quality control.',
    },
    {
      icon: 'fa-graduation-cap',
      title: 'Education',
      text: 'AI-powered learning platforms, student analytics, and automated assessments.',
    },
    {
      icon: 'fa-truck',
      title: 'Logistics',
      text: 'Supply chain optimization, route planning, and real-time tracking systems.',
    },
    {
      icon: 'fa-bolt',
      title: 'Energy & Utilities',
      text: 'Smart grid management, consumption forecasting, and sustainability analytics.',
    },
    {
      icon: 'fa-shield-halved',
      title: 'Insurance',
      text: 'Claims automation, risk assessment, and fraud detection with AI.',
    },
  ],
  cta: {
    text: "Don't see your industry? We create custom solutions for any sector.",
    label: 'Discuss Your Industry Needs',
    href: '/contact',
    icon: 'fa-message',
  },
  process: {
    badge: 'Our Process',
    title: 'From Idea to',
    accent: 'MVP in Weeks',
    lead: 'Our battle-tested methodology delivers production-ready solutions faster than traditional approaches.',
    steps: [
      {
        icon: 'fa-lightbulb',
        title: 'Discovery',
        text: 'Deep-dive into your business goals, challenges, and data landscape to define the optimal AI strategy.',
        when: 'Week 1-2',
      },
      {
        icon: 'fa-pen-ruler',
        title: 'Design',
        text: 'Architect your AI solution with scalable infrastructure, selecting the right models and workflows.',
        when: 'Week 2-3',
      },
      {
        icon: 'fa-rocket',
        title: 'Build & Deploy',
        text: 'Rapid development using pre-built AI components, followed by staged deployment to production.',
        when: 'Week 3-6',
      },
      {
        icon: 'fa-chart-line',
        title: 'Optimize & Scale',
        text: 'Continuous monitoring, optimization, and scaling support to maximize ROI and performance.',
        when: 'Ongoing',
      },
    ],
  },
};

export const HOME_PARTNER_PROPS = {
  id: 'partner',
  badge: 'The AI-First Technology Partner',
  title: 'Why Leading Enterprises Choose',
  accent: 'Exyconn',
  lead: "We don't just build AI—we architect intelligent systems that transform how businesses operate. Our unique combination of deep AI expertise and enterprise SaaS experience delivers measurable results.",
  actions: [
    { href: '/case-studies', icon: 'fa-chart-column', label: 'View Case Studies' },
    { href: '/contact', icon: 'fa-calendar-check', label: 'Schedule Demo' },
  ],
  values: [
    {
      icon: 'fa-rocket',
      title: 'Production-Ready AI',
      text: 'Deploy AI agents that work in production from day one—not proofs of concept.',
    },
    {
      icon: 'fa-cloud',
      title: 'SaaS-Native Platforms',
      text: 'Our platforms are built cloud-first with enterprise security and 99.9% uptime.',
    },
    {
      icon: 'fa-bolt',
      title: '10x Faster Delivery',
      text: 'Pre-built components and AI accelerators cut implementation time by 90%.',
    },
    {
      icon: 'fa-handshake',
      title: 'End-to-End Partnership',
      text: "From strategy through deployment to 24/7 support—we're with you all the way.",
    },
  ],
  image: {
    src: 'https://images.pexels.com/photos/3861973/pexels-photo-3861973.jpeg?auto=compress&w=800&q=80',
    alt: 'Exyconn AI Team',
  },
  stats: [
    { value: '98%', label: 'Client Retention' },
    { value: '500+', label: 'AI Deployments' },
  ],
  techTitle: 'Powered By Leading Technology',
  techSubtitle: 'Cutting-Edge AI & Cloud Infrastructure',
  techLogos: [
    { name: 'OpenAI', src: '/logos/openai.svg' },
    { name: 'Anthropic', src: '/logos/anthropic.svg' },
    { name: 'Google Cloud', src: '/logos/google-cloud.svg' },
    { name: 'AWS', src: '/logos/aws.png' },
    { name: 'Azure', src: '/logos/azure.svg' },
    { name: 'Gemini', src: '/logos/gemini.png' },
  ],
};

const platform = (name: string, file: string) => ({ name, src: `/logos/platforms/${file}.svg` });

export const HOME_PLATFORMS_PROPS = {
  id: 'platforms',
  title: 'Platforms We Build On and Integrate',
  lead: 'The clouds, AI models, data platforms and business systems our agents and automations run on — and connect your stack to.',
  rows: [
    {
      logos: [
        platform('Amazon Web Services', 'aws'),
        platform('Ingram Micro', 'ingram-micro'),
        platform('Claude', 'claude'),
        platform('Google Cloud Platform', 'google-cloud'),
        platform('Azure', 'azure'),
        platform('ServiceNow', 'servicenow'),
        platform('Adobe', 'adobe'),
        platform('Magento', 'magento'),
        platform('Databricks', 'databricks'),
        platform('Snowflake', 'snowflake'),
        platform('HubSpot', 'hubspot'),
        platform('Moengage', 'moengage'),
        platform('Boomi', 'boomi'),
        platform('Docker', 'docker'),
      ],
    },
    {
      logos: [
        platform('OpenAI', 'openai'),
        platform('AWS Bedrock', 'aws-bedrock'),
        platform('MuleSoft', 'mulesoft'),
        platform('OneStream', 'onestream'),
        platform('Oracle', 'oracle'),
        platform('Salesforce', 'salesforce'),
        platform('Red Hat', 'red-hat'),
        platform('Sabre', 'sabre'),
        platform('Stripe', 'stripe'),
        platform('Cloudinary', 'cloudinary'),
      ],
    },
  ],
};

/** The closing chapter's label, title and lead are the company's own (Admin › Branding). */
export const HOME_CLOSING_PROPS = {
  id: 'start',
  actions: [
    { href: '/contact', icon: 'fa-calendar-check', label: 'Start Your Project' },
    { href: '/ai-services', icon: 'fa-bolt', label: 'Explore AI Services' },
  ],
};
