/**
 * The services hub and service pages' sections: the words of the first page that uses each, as it was before the CMS.
 */

export const SERVICE_WHATSAPP_DEMO_PROPS = {
  business: 'Smile Dental Clinic',
  status: 'online',
  caption: 'A real booking flow, start to finish, in under a minute.',
  ariaLabel: 'WhatsApp conversation with {business}',
  messages: [
    {
      id: 'greet',
      from: 'bot',
      text: 'Hi Priya! Welcome to Smile Dental. How can we help today?',
      buttons: ['Book appointment', 'Clinic timings', 'Talk to us'],
    },
    {
      id: 'pick',
      from: 'customer',
      text: 'Book appointment',
      buttons: [],
    },
    {
      id: 'day',
      from: 'bot',
      text: 'Sure. Which day suits you?',
      buttons: ['Tomorrow', 'Thursday', 'Friday'],
    },
    {
      id: 'when',
      from: 'customer',
      text: 'Tomorrow evening',
      buttons: [],
    },
    {
      id: 'slot',
      from: 'bot',
      text: '6:30 PM with Dr. Mehta is free. Shall I book it?',
      buttons: ['Confirm', 'Other time'],
    },
    {
      id: 'yes',
      from: 'customer',
      text: 'Confirm',
      buttons: [],
    },
    {
      id: 'done',
      from: 'bot',
      text: 'Booked! You will get a reminder two hours before. See you tomorrow.',
      buttons: [],
    },
  ],
};

export const SERVICE_GROUPED_CARDS_PROPS = {
  index: 1,
  id: 'pillars',
  label: 'Pillars',
  title: 'Three ways we move your business',
  lede: 'Pick the pillar that matches where you are. Each service page shows what we deliver and how we work.',
  more: 'Explore',
  highlight: true,
  groups: [
    {
      id: 'build',
      label: 'Build',
      title: 'Build what is next',
      text: 'Powerful applications for web and mobile, built by a team that owns the outcome.',
      cards: [
        {
          href: '/services/software-development-outsourcing',
          title: 'Software development outsourcing',
          text: 'Access top talent and accelerate delivery with flexible engagement models.',
          tags: ['Dedicated teams', 'Augmentation', 'Delivery'],
          index: 'B/01',
        },
        {
          href: '/services/mobile-application-development',
          title: 'Mobile application development',
          text: 'High-performance, user-friendly mobile apps for iOS and Android.',
          tags: ['iOS', 'Android', 'Cross-platform'],
          index: 'B/02',
        },
        {
          href: '/services/enterprise-application',
          title: 'Enterprise application',
          text: 'Build, scale and optimise robust enterprise applications.',
          tags: ['Secure', 'High-performance', 'Large-scale'],
          index: 'B/03',
        },
        {
          href: '/services/software-as-a-service',
          title: 'Software as a service',
          text: 'Scalable, secure and innovative SaaS, designed, built and managed.',
          tags: ['Cloud', 'Multi-tenant', 'Managed'],
          index: 'B/04',
        },
      ],
    },
    {
      id: 'modernise',
      label: 'Modernise',
      title: 'Modernise what runs',
      text: 'Upgrade legacy systems, connect what is siloed and keep it all running smoothly.',
      cards: [
        {
          href: '/services/application-modernization',
          title: 'Application modernization',
          text: 'Upgrade legacy systems for performance, security and innovation.',
          tags: ['Migration', 'Legacy', 'Performance'],
          index: 'M/01',
        },
        {
          href: '/services/automation-integration',
          title: 'Automation & integration',
          text: 'Automate workflows and integrate your business systems for efficiency.',
          tags: ['Workflows', 'APIs', 'Integration'],
          index: 'M/02',
        },
        {
          href: '/services/whatsapp-chatbot',
          title: 'WhatsApp chatbot',
          text: 'Book, sell and support customers inside WhatsApp — try the live demo.',
          tags: ['WhatsApp', 'Chatbots', 'Live demo'],
          index: 'M/03',
        },
        {
          href: '/services/maintenance',
          title: 'Maintenance & support',
          text: 'Keep your applications running smoothly with proactive support.',
          tags: ['Monitoring', 'Updates', 'Support'],
          index: 'M/04',
        },
      ],
    },
    {
      id: 'grow',
      label: 'Grow',
      title: 'Grow what works',
      text: 'Unlock insights, sharpen the strategy and turn traffic into revenue.',
      cards: [
        {
          href: '/services/data-analytics',
          title: 'Data analytics',
          text: 'Turn your data into actionable insights for smarter decisions.',
          tags: ['BI', 'Visualisation', 'Insights'],
          index: 'G/01',
        },
        {
          href: '/services/digital-consulting',
          title: 'Digital consulting',
          text: 'Accelerate your digital transformation with strategy and technology consulting.',
          tags: ['Strategy', 'AI', 'Transformation'],
          index: 'G/02',
        },
        {
          href: '/services/digital-marketing',
          title: 'Digital marketing',
          text: 'Grow brand, traffic and revenue with full-funnel marketing services.',
          tags: ['SEO', 'Paid media', 'CRO'],
          index: 'G/03',
        },
      ],
    },
  ],
};

export const SERVICE_STEPS_PROPS = {
  index: 2,
  id: 'lifecycle',
  label: 'Lifecycle',
  title: 'With you across the whole lifecycle',
  highlight: false,
  steps: [
    {
      title: 'Ideation',
      text: 'Validate and enhance product ideas with our domain and technology expertise.',
    },
    {
      title: 'Development & launch',
      text: 'Optimise development costs with stable, predictable delivery via shared ownership.',
    },
    {
      title: 'Growth & maturity',
      text: 'Supercharge growth and operational efficiency with delivery ownership transfer.',
    },
    {
      title: 'End of life',
      text: 'Optimise costs and enable demand throttling with portfolio ownership transfer.',
    },
  ],
};

export const SERVICE_RELATED_HUBS_PROPS = {
  index: 3,
  label: 'Explore',
  title: 'AI, platform and the full portfolio',
  links: [
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
    {
      href: '/ai-services',
      title: 'AI services catalogue',
      text: 'Every AI product and build service we offer, by capability area.',
      more: 'Open the catalogue',
    },
  ],
  featured: {
    href: '',
    title: '',
    text: '',
    more: '',
  },
};

export const SERVICE_INFO_GRID_PROPS = {
  index: 1,
  id: 'capabilities',
  anchor: '',
  label: 'Capabilities',
  title: 'Every marketing service under one roof',
  lede: 'One integrated team across strategy, creative, paid, organic and analytics — so your funnel works end to end.',
  indexPrefix: 'M',
  items: [
    {
      id: 'seo',
      title: 'SEO (search engine optimization)',
      text: 'Rank higher on Google and capture qualified organic demand with technical SEO, on-page optimization, content strategy and authoritative link building.',
      points: [
        'Technical SEO audits & Core Web Vitals',
        'On-page optimization & schema markup',
        'Keyword research & content gap analysis',
        'Link building & digital PR',
        'Local SEO & Google Business Profile',
        'International & multilingual SEO',
      ],
    },
    {
      id: 'ppc',
      title: 'Performance marketing & PPC',
      text: 'Full-funnel paid media across Google, Meta, LinkedIn, YouTube and programmatic — engineered for ROAS, not vanity metrics.',
      points: [
        'Google Ads (Search, Performance Max, Shopping)',
        'Meta Ads (Facebook & Instagram)',
        'LinkedIn Ads for B2B',
        'YouTube & video advertising',
        'Programmatic & display retargeting',
        'Bid management & budget pacing',
      ],
    },
    {
      id: 'social',
      title: 'Social media marketing',
      text: 'Build a brand people remember. Strategy, content production, community management and paid social on every platform that matters.',
      points: [
        'Channel strategy & content calendars',
        'Reels, shorts & short-form video',
        'Community management & engagement',
        'Paid social campaigns',
        'Social listening & reputation',
        'Platform analytics & growth reports',
      ],
    },
    {
      id: 'content',
      title: 'Content marketing & copywriting',
      text: 'SEO-led blogs, conversion-focused landing pages, whitepapers, case studies and video scripts that move people from awareness to revenue.',
      points: [
        'Long-form blog & article writing',
        'Landing page & sales copy',
        'Whitepapers, eBooks & case studies',
        'Video scripts & YouTube content',
        'Editorial calendars & topic clusters',
        'AI-assisted content workflows',
      ],
    },
    {
      id: 'email',
      title: 'Email & marketing automation',
      text: 'Lifecycle email, drip sequences, CRM workflows and lead nurturing using HubSpot, Mailchimp, Klaviyo, ActiveCampaign and custom stacks.',
      points: [
        'Welcome & onboarding flows',
        'Lead nurture & drip campaigns',
        'Cart abandonment & re-engagement',
        'Newsletter strategy & design',
        'CRM workflows (HubSpot, Salesforce)',
        'Deliverability & inbox placement',
      ],
    },
    {
      id: 'branding',
      title: 'Branding & creative design',
      text: 'Logo, brand identity, ad creatives and motion graphics that stop the scroll and stay in memory.',
      points: [
        'Logo & visual identity systems',
        'Brand guidelines & messaging',
        'Static & video ad creatives',
        'Motion graphics & animation',
        'Pitch decks & sales collateral',
        'Packaging & print design',
      ],
    },
    {
      id: 'influencer',
      title: 'Influencer & affiliate marketing',
      text: 'Scale word-of-mouth with vetted creator partnerships, UGC campaigns and performance-based affiliate programs.',
      points: [
        'Influencer discovery & vetting',
        'Campaign briefs & contract management',
        'UGC content production',
        'Affiliate program setup & tracking',
        'Creator relationship management',
        'Performance & ROI reporting',
      ],
    },
    {
      id: 'cro',
      title: 'Conversion rate optimization (CRO)',
      text: 'Funnel audits, A/B testing, heatmaps and UX improvements that turn existing traffic into more revenue.',
      points: [
        'Conversion funnel audits',
        'A/B & multivariate testing',
        'Heatmaps & session recordings',
        'Landing page optimization',
        'Checkout & form optimization',
        'Personalization & segmentation',
      ],
    },
    {
      id: 'analytics',
      title: 'Marketing analytics & reporting',
      text: 'GA4, GTM, server-side tracking, attribution modeling and executive dashboards that turn data into clear decisions.',
      points: [
        'GA4 & GTM implementation',
        'Server-side tracking & consent mode',
        'Attribution modeling',
        'Looker Studio & Power BI dashboards',
        'Marketing mix & incrementality',
        'Monthly performance reviews',
      ],
    },
  ],
};

export const SERVICE_DEFINITION_PROPS = {
  index: 1,
  id: 'definition',
  label: 'Definition',
  title: 'What software development outsourcing is',
  text: 'Software development outsourcing is the practice of delegating software engineering tasks — from full-cycle product development to team augmentation — to an external partner. It gives businesses specialised talent, a faster time-to-market and room to focus on core competencies while reducing operational costs.',
};

export const SERVICE_BENEFITS_PROPS = {
  index: 3,
  id: 'benefits',
  label: 'Why Exyconn',
  title: 'What outsourcing to us changes',
  items: [
    {
      title: 'Access to top talent',
      text: 'Top-tier professionals bridge any expertise gap. No talent searches on your side — skilled engineers are ready to go.',
    },
    {
      title: 'Flexible engagement models',
      text: 'From autonomous squads and application ownership to team augmentation — we adapt and scale on demand.',
    },
    {
      title: 'Global presence',
      text: 'Clients across multiple geographies, served from location-optimised delivery centres.',
    },
    {
      title: 'Measurable success',
      text: 'Key metrics turn progress and outcomes into objective, quantitative data — full visibility.',
    },
    {
      title: 'Efficient knowledge management',
      text: 'Thorough documentation, knowledge transfer and internal wikis keep every stage transparent.',
    },
    {
      title: 'Holistic approach',
      text: 'Cross-functional teams combine technology, industry expertise and human-centred design.',
    },
  ],
  assurances: [
    {
      title: 'Enterprise-grade security',
      text: 'Best practices for data security, encryption and compliance throughout the SDLC.',
    },
    {
      title: 'Faster time-to-market',
      text: 'Dedicated teams and agile processes for rapid, iterative delivery on predictable timelines.',
    },
    {
      title: 'Cost optimization',
      text: 'Lower operational overhead with flexible engagement models and location-optimised delivery.',
    },
    {
      title: 'Proven track record',
      text: 'Clients across diverse industries — from ambitious startups to Fortune-level enterprises.',
    },
    {
      title: 'Advanced teams',
      text: 'Engineers with advanced degrees and industry certifications for reliable delivery.',
    },
  ],
};

export const SERVICE_FAQ_PROPS = {
  index: 5,
  id: 'faq',
  label: 'FAQ',
  title: 'Outsourcing questions, answered',
  items: [
    {
      question: 'What is software development outsourcing?',
      answer:
        'Software development outsourcing is the practice of hiring an external company to handle some or all of your software engineering needs — from full product development to team augmentation and application management.',
    },
    {
      question: 'Why should I consider outsourcing software development?',
      answer:
        'Outsourcing gives you access to specialized talent, reduces development costs, accelerates time-to-market, and lets you focus on core business activities. It also provides flexibility to scale teams up or down as needed.',
    },
    {
      question: 'What engagement models does Exyconn offer?',
      answer:
        'We offer multiple models: dedicated development teams, project-based development, team augmentation, and managed services. We tailor the approach based on your project requirements and goals.',
    },
    {
      question: 'How do you handle communication across different time zones?',
      answer:
        'We use asynchronous communication tools, overlapping working hours, and regular standups to ensure seamless collaboration. Our project managers act as a bridge between your team and ours.',
    },
    {
      question: 'Can I scale my development team as needed?',
      answer:
        'Absolutely. One of the key advantages of outsourcing with Exyconn is the ability to quickly scale your team up or down based on project demands without the overhead of traditional hiring.',
    },
    {
      question: 'How do you ensure code quality and project transparency?',
      answer:
        'We follow agile methodologies, conduct regular code reviews, maintain CI/CD pipelines, and provide clients with full access to project metrics, repositories, and progress dashboards.',
    },
  ],
};
