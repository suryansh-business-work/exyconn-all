/**
 * The capability and service detail pages' sections (/ai/*, /services/*): the words of the first page that uses each, as it was before the CMS.
 */

export const DETAIL_TABS_PROPS = {
  index: 4,
  label: 'Explore',
  title: 'Major large language models (llms)',
  items: [
    {
      label: 'OpenAI (ChatGPT)',
      summary: 'Popular, versatile, and widely adopted',
      text: "OpenAI's ChatGPT is a leading LLM known for its conversational abilities, content generation, summarization, and code assistance. It powers a wide range of business and consumer applications, offering robust APIs and continuous improvements.",
      points: [
        'Excellent at natural language understanding and generation',
        'Supports plugins, fine-tuning, and API integration',
        'Used for chatbots, automation, search, and more',
      ],
      logo: {
        name: 'OpenAI',
        src: '/logos/openai.svg',
        width: 512,
        height: 142,
      },
    },
    {
      label: 'Gemini',
      summary: "Google's advanced multimodal LLM",
      text: "Gemini is Google's next-generation LLM, designed for text, image, and code tasks. It integrates deeply with Google Cloud and Workspace, enabling advanced AI features for enterprise and productivity solutions.",
      points: [
        'Handles text, images, and code in a unified model',
        'Integrates with Google products and APIs',
        'Ideal for business automation and productivity',
      ],
      logo: {
        name: 'Gemini',
        src: '/logos/gemini.png',
        width: 3304,
        height: 1200,
      },
    },
    {
      label: 'Claude',
      summary: "Anthropic's safe and ethical LLM",
      text: 'Claude by Anthropic focuses on safety, transparency, and ethical AI. It is used for enterprise chat, summarization, and automation, with a strong emphasis on responsible AI deployment.',
      points: [
        'Prioritizes safety and transparency',
        'Great for enterprise chat and document workflows',
        'Flexible deployment and compliance options',
      ],
      logo: {
        name: 'Claude',
        src: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg',
        width: 690,
        height: 148,
      },
    },
  ],
  previous: 'Previous',
  next: 'Next',
};

export const DETAIL_STAGE_PROPS = {
  family: 'ai',
  crumbs: [
    {
      label: 'Home',
      href: '/',
    },
    {
      label: 'AI',
      href: '/ai',
    },
    {
      label: 'Agentic AI',
      href: '',
    },
  ],
  title: 'Agentic AI that adapts, decides and acts',
  lede: 'Empower your organization with Agentic AI—autonomous systems that perceive, learn, and act to achieve your business goals. Unlock new levels of automation, adaptability, and collaboration with next-generation AI agents.',
  primary: {
    label: 'Contact us',
    href: '/contact',
  },
  secondary: {
    label: 'Browse AI services',
    href: '/ai-services',
  },
  scene: {
    shapes: ['neuralCore'],
    data: {
      neuralCore: {
        modules: 8,
      },
    },
  },
  glyph: '',
  tagline: 'Adapt. Decide. Act.',
};

export const DETAIL_LOGOS_PROPS = {
  label: 'Our business tools',
  logos: [
    {
      name: 'Claude',
      src: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg',
      width: 690,
      height: 148,
    },
    {
      name: 'OpenAI',
      src: '/logos/openai.svg',
      width: 512,
      height: 142,
    },
    {
      name: 'Gemini',
      src: '/logos/gemini.png',
      width: 3304,
      height: 1200,
    },
  ],
};

export const DETAIL_INTRO_PROPS = {
  index: 1,
  label: 'What it is',
  intro: {
    title: 'What is agentic AI?',
    icon: 'brain',
    term: 'Agentic AI',
    definition:
      'refers to artificial intelligence systems that act as autonomous agents—capable of perceiving their environment, making decisions, and taking actions to achieve specific goals. Unlike traditional AI, which often follows static rules or models, agentic AI adapts, learns, and collaborates, making it ideal for dynamic, real-world scenarios.',
  },
  benefits: {
    title: 'Why do we need agentic AI?',
    items: [
      {
        icon: 'bolt',
        text: 'Automates complex, multi-step business processes.',
      },
      {
        icon: 'arrows-rotate',
        text: 'Adapts to changing environments and requirements.',
      },
      {
        icon: 'money-bill-trend-up',
        text: 'Reduces manual intervention and operational costs.',
      },
      {
        icon: 'gauge-high',
        text: 'Enables real-time decision-making and optimization.',
      },
      {
        icon: 'lightbulb',
        text: 'Drives innovation in customer service, logistics, finance, and more.',
      },
    ],
  },
  demo: {
    kind: 'trace',
    title: 'agent · trace',
    caption: "An autonomous agent's loop: it perceives, decides, acts and learns from feedback.",
    steps: [
      {
        label: 'Perceive',
        detail: 'Its environment and the data around it',
      },
      {
        label: 'Decide',
        detail: 'Smarter, context-aware decisions in real time',
      },
      {
        label: 'Act',
        detail: 'Actions that move it towards a specific goal',
      },
      {
        label: 'Learn',
        detail: 'From data and feedback, adapting as it goes',
      },
    ],
  },
};

export const DETAIL_ARCHITECTURE_PROPS = {
  index: 2,
  label: 'Architecture',
  title: 'An autonomous agent, layer by layer',
  layers: [
    {
      label: 'Environment',
      nodes: ['Data', 'Platforms', 'People'],
    },
    {
      label: 'Agent',
      nodes: ['Perceive', 'Decide', 'Act'],
    },
    {
      label: 'Improvement',
      nodes: ['Learn', 'Adapt'],
    },
    {
      label: 'Oversight',
      nodes: ['Monitoring', 'Human oversight'],
    },
  ],
};

export const DETAIL_OFFERINGS_PROPS = {
  index: 3,
  label: 'Use cases',
  offerings: {
    title: 'How does agentic AI solve my problem?',
    items: [
      {
        icon: 'gears',
        title: 'Process automation',
        text: 'Automates repetitive and complex workflows, freeing up human resources for higher-value tasks.',
      },
      {
        icon: 'brain',
        title: 'Adaptive decision-making',
        text: 'Learns from data and feedback to make smarter, context-aware decisions in real time.',
      },
      {
        icon: 'users',
        title: 'Collaboration & integration',
        text: 'Works seamlessly with humans and other systems, integrating across platforms and teams.',
      },
    ],
  },
};

export const DETAIL_FAQ_PROPS = {
  index: 5,
  label: 'FAQ',
  title: 'Questions about Agentic AI',
  items: [
    {
      question: 'What makes Agentic AI different from traditional AI?',
      answer:
        'Agentic AI systems act autonomously, adapt to changing environments, and make decisions to achieve specific goals, unlike traditional AI which often follows static rules.',
    },
    {
      question: 'Can Agentic AI work with my existing business systems?',
      answer:
        'Yes, Agentic AI can integrate with your current platforms and tools, enabling seamless automation and collaboration across your organization.',
    },
    {
      question: 'Is Agentic AI safe and reliable?',
      answer:
        'With proper monitoring, high-quality data, and human oversight, Agentic AI can be both safe and reliable for business-critical applications.',
    },
    {
      question: 'What are the first steps to adopt Agentic AI?',
      answer:
        'Start by identifying processes that benefit from autonomy, assess your data readiness, and launch pilot projects to measure impact before scaling.',
    },
  ],
};

export const DETAIL_RELATED_PROPS = {
  index: 6,
  label: 'More AI capabilities',
  title: 'Keep exploring AI',
  more: 'Explore',
  cards: [
    {
      href: '/ai/llms',
      index: 'AI/02',
      title: 'Large language models',
      text: 'Unlock the power of Large Language Models (LLMs) for your business.',
      tags: ['Conversational AI', 'Content automation', 'Knowledge & search'],
    },
    {
      href: '/ai/models',
      index: 'AI/03',
      title: 'Ready-to-use AI models',
      text: "Explore Exyconn's library of ready-to-use AI models for NLP, vision, analytics, and automation.",
      tags: ['NLP & text', 'Vision & image', 'Analytics & automation'],
    },
    {
      href: '/ai/custom-model-training',
      index: 'AI/04',
      title: 'Custom model training',
      text: 'Unlock the power of AI tailored to your business.',
      tags: ['Data preparation', 'Model fine-tuning', 'Deployment & support'],
    },
  ],
};

export const DETAIL_CTA_PROPS = {
  family: 'ai',
  label: 'Next step',
  title: 'Start with Agentic AI',
  text: 'Adapt. Decide. Act.',
  primary: {
    label: 'Contact us',
    href: '/contact',
  },
  secondary: {
    label: 'Get a quote',
    href: '/get-a-quote',
  },
  echoShape: 0,
};

export const DETAIL_PROCESS_PROPS = {
  index: 3,
  label: 'How we work',
  title: 'From Idea to MVP in Weeks',
  lede: 'Our battle-tested methodology delivers production-ready solutions faster than traditional approaches.',
  steps: [
    {
      title: 'Discovery',
      text: 'Deep-dive into your business goals, challenges, and data landscape to define the optimal AI strategy.',
      when: 'Week 1-2',
    },
    {
      title: 'Design',
      text: 'Architect your AI solution with scalable infrastructure, selecting the right models and workflows.',
      when: 'Week 2-3',
    },
    {
      title: 'Build & Deploy',
      text: 'Rapid development using pre-built AI components, followed by staged deployment to production.',
      when: 'Week 3-6',
    },
    {
      title: 'Optimize & Scale',
      text: 'Continuous monitoring, optimization, and scaling support to maximize ROI and performance.',
      when: 'Ongoing',
    },
  ],
};

export const DETAIL_LIVE_PROPS = {
  index: 2,
  label: 'Live demo',
  title: 'See it live, then try it yourself',
  lede: 'Watch a booking happen in WhatsApp, then sign in with your email and a one-time code to chat with every demo bot — retail, clinics, restaurants, real estate and more.',
};

export const DETAIL_PROOF_PROPS = {
  label: 'Services at a glance',
  items: [
    {
      value: '11',
      label: 'Services',
    },
    {
      value: '50+',
      label: 'Projects delivered',
    },
    {
      value: '100%',
      label: 'Client satisfaction',
    },
    {
      value: '24/7',
      label: 'Support available',
    },
  ],
};
