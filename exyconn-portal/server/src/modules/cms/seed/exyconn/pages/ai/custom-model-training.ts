import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/ai/custom-model-training (formerly exyconn-website/src/pages/[market]/ai/custom-model-training.astro). */
export const AI_CUSTOM_MODEL_TRAINING_PAGE: CmsSeedPage = {
  key: 'ai-custom-model-training',
  path: '/ai/custom-model-training',
  kind: 'PAGE',
  title: 'Custom AI Model Training | Exyconn',
  layout: 'default',
  seo: {
    title: 'Custom AI Model Training | Exyconn',
    description:
      'Unlock the power of AI tailored to your business. Exyconn offers custom model training services—fine-tune LLMs, vision, and predictive models on your data for maximum impact.',
    keywords: 'custom AI model training, fine-tuning, LLM, machine learning, business AI, Exyconn',
    ogImageUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    canonical: '',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://exyconn.com/{market}',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI',
            item: 'https://exyconn.com/{market}/ai',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Custom model training',
            item: 'https://exyconn.com/{market}/ai/custom-model-training',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Custom model training',
        description:
          'Unlock the power of AI tailored to your business. Exyconn offers custom model training services—fine-tune LLMs, vision, and predictive models on your data for maximum impact.',
        url: 'https://exyconn.com/{market}/ai/custom-model-training',
        serviceType: 'AI',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'How custom model training works',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Data preparation',
              description:
                'We help you collect, clean, and structure your business data for training.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Model fine-tuning',
              description:
                'Our experts fine-tune state-of-the-art models (LLMs, vision, etc.) on your data.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Deployment & support',
              description:
                'Deploy your custom model securely—on cloud or on-premises—with ongoing support.',
            },
          ],
        },
      },
    ],
  },
  html: [
    place('detail.stage', {
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
          label: 'Custom model training',
          href: '',
        },
      ],
      title: 'AI models trained on your own data',
      lede: 'Empower your business with AI models trained on your unique data. Exyconn helps you fine-tune large language models, vision models, and predictive systems for your specific industry, workflow, and goals.',
      primary: {
        label: 'Request a consultation',
        href: '/contact',
      },
      secondary: {
        label: 'Browse AI services',
        href: '/ai-services',
      },
      scene: {
        shapes: ['converge'],
      },
      glyph: '',
      tagline: 'Tailored Intelligence. Real Results.',
    }),
    place('detail.logos', {
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
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What is custom model training?',
        icon: 'brain',
        term: 'Custom model training',
        definition:
          'is the process of adapting and fine-tuning AI models—such as LLMs, vision, or predictive models—on your proprietary data. This delivers higher accuracy, relevance, and business value compared to generic, off-the-shelf models.',
      },
      benefits: {
        title: 'Why choose custom model training?',
        items: [
          {
            icon: 'database',
            text: 'Leverages your unique business data for better results.',
          },
          {
            icon: 'bullseye',
            text: 'Improves accuracy and relevance for your use case.',
          },
          {
            icon: 'lock',
            text: 'Keeps sensitive data secure and models private.',
          },
          {
            icon: 'chart-line',
            text: 'Drives measurable ROI with tailored AI solutions.',
          },
          {
            icon: 'gears',
            text: 'Supports a wide range of tasks: NLP, vision, prediction, and more.',
          },
        ],
      },
      demo: {
        kind: 'trace',
        title: 'training plan',
        caption:
          'A custom training plan: the data needed, the models tuned, where training runs and how long it takes.',
        steps: [
          {
            label: 'Data',
            detail: 'A few thousand quality examples',
          },
          {
            label: 'Models',
            detail: 'LLMs, computer vision models, time-series predictors',
          },
          {
            label: 'Training',
            detail: 'On-premises, private cloud or secure cloud',
          },
          {
            label: 'Timeline',
            detail: 'A few weeks to a few months',
          },
        ],
      },
    }),
    place('detail.architecture', {
      index: 2,
      label: 'Architecture',
      title: 'From your data to a deployed model',
      layers: [
        {
          label: 'Your data',
          nodes: ['Collect', 'Clean', 'Structure'],
        },
        {
          label: 'Fine-tuning',
          nodes: ['LLMs', 'Vision', 'Time-series'],
        },
        {
          label: 'Training on',
          nodes: ['On-premises', 'Private cloud', 'Secure cloud'],
        },
        {
          label: 'Deployment',
          nodes: ['Cloud', 'On-premises', 'Ongoing support'],
        },
      ],
    }),
    place('detail.offerings', {
      index: 3,
      label: 'Use cases',
      offerings: {
        title: 'How custom model training works',
        items: [
          {
            icon: 'upload',
            title: 'Data preparation',
            text: 'We help you collect, clean, and structure your business data for training.',
          },
          {
            icon: 'brain',
            title: 'Model fine-tuning',
            text: 'Our experts fine-tune state-of-the-art models (LLMs, vision, etc.) on your data.',
          },
          {
            icon: 'rocket',
            title: 'Deployment & support',
            text: 'Deploy your custom model securely—on cloud or on-premises—with ongoing support.',
          },
        ],
      },
    }),
    place('detail.faq', {
      index: 4,
      label: 'FAQ',
      title: 'Questions about Custom model training',
      items: [
        {
          question: 'What types of models can Exyconn fine-tune?',
          answer:
            'We can fine-tune large language models (LLMs), computer vision models, time-series predictors, and more—tailored to your business needs.',
        },
        {
          question: 'Do I need a lot of data for custom training?',
          answer:
            'More data helps, but we can often achieve strong results with a few thousand quality examples. We’ll advise on data requirements for your use case.',
        },
        {
          question: 'Is my data secure during training?',
          answer:
            'Yes, your data remains private and secure. We offer on-premises, private cloud, and secure cloud training options.',
        },
        {
          question: 'How long does custom model training take?',
          answer:
            'Typical projects take from a few weeks to a few months, depending on data size, complexity, and deployment needs.',
        },
        {
          question: 'How do I get started with custom model training?',
          answer:
            'Contact Exyconn for a free consultation. We’ll assess your needs, data, and goals, then propose a tailored AI training plan.',
        },
      ],
    }),
    place('detail.related', {
      index: 5,
      label: 'More AI capabilities',
      title: 'Keep exploring AI',
      more: 'Explore',
      cards: [
        {
          href: '/ai/mcp-server',
          index: 'AI/05',
          title: 'MCP server',
          text: "Explore Exyconn's MCP Server: a Model Context Protocol platform for orchestrating AI agents, managing multi-channel workflows, and automating business processes with context-aware intelligence.",
          tags: ['Context-aware orchestration', 'AI agent management', 'Seamless integration'],
        },
        {
          href: '/ai/workflows',
          index: 'AI/06',
          title: 'AI workflows',
          text: 'Discover how AI-powered workflows can automate, optimize, and scale your business processes.',
          tags: ['End-to-end automation', 'Real-time analytics', 'Seamless collaboration'],
        },
        {
          href: '/ai/bot-creation',
          index: 'AI/07',
          title: 'AI bot creation',
          text: 'Build custom AI bots for chat, support, automation, and business workflows with Exyconn.',
          tags: ['Conversational bots', 'Workflow bots', 'Support bots'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'ai',
      label: 'Next step',
      title: 'Start with Custom model training',
      text: 'Tailored Intelligence. Real Results.',
      primary: {
        label: 'Request a consultation',
        href: '/contact',
      },
      secondary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      echoShape: 0,
    }),
  ].join(''),
  css: '',
};
