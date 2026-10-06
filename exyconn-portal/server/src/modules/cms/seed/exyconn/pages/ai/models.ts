import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/ai/models (formerly exyconn-website/src/pages/[market]/ai/models.astro). */
export const AI_MODELS_PAGE: CmsSeedPage = {
  key: 'ai-models',
  path: '/ai/models',
  kind: 'PAGE',
  title: 'Ready-to-Use AI Models | NLP, Vision, and More | Exyconn',
  layout: 'default',
  seo: {
    title: 'Ready-to-Use AI Models | NLP, Vision, and More | Exyconn',
    description:
      "Explore Exyconn's library of ready-to-use AI models for NLP, vision, analytics, and automation. Deploy proven models instantly for chat, classification, extraction, and more.",
    keywords:
      'AI models, ready-to-use AI, NLP models, vision models, analytics, automation, Exyconn',
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
            name: 'Ready-to-use AI models',
            item: 'https://exyconn.com/{market}/ai/models',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Ready-to-use AI models',
        description:
          "Explore Exyconn's library of ready-to-use AI models for NLP, vision, analytics, and automation. Deploy proven models instantly for chat, classification, extraction, and more.",
        url: 'https://exyconn.com/{market}/ai/models',
        serviceType: 'AI',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Popular model categories',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'NLP & text',
              description:
                'Text classification, sentiment analysis, entity extraction, summarization, translation, and more.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Vision & image',
              description:
                'Image classification, object detection, OCR, face recognition, and visual search.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Analytics & automation',
              description:
                'Forecasting, anomaly detection, document processing, and workflow automation.',
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
          label: 'Ready-to-use AI models',
          href: '',
        },
      ],
      title: 'Production-ready AI models, no training required',
      lede: 'Accelerate your projects with Exyconn’s library of pre-trained, production-ready AI models. From NLP and vision to analytics and automation, our models are ready to power your business use cases—no training required.',
      primary: {
        label: 'See all models',
        href: '/contact',
      },
      secondary: {
        label: 'Browse AI services',
        href: '/ai-services',
      },
      scene: {
        shapes: ['layers'],
      },
      glyph: '',
      tagline: 'Deploy Proven AI Instantly',
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
        title: 'What are ready-to-use AI models?',
        icon: 'cubes',
        term: 'Ready-to-use AI models',
        definition:
          'are pre-trained, production-grade models for common business tasks—such as text classification, sentiment analysis, document extraction, image recognition, and more. Instantly deploy these models via API or integrate them into your workflows.',
      },
      benefits: {
        title: 'Why use pre-built AI models?',
        items: [
          {
            icon: 'rocket',
            text: 'Instant deployment—no training or data science required.',
          },
          {
            icon: 'gears',
            text: 'Covers a wide range of business use cases: NLP, vision, analytics, and more.',
          },
          {
            icon: 'plug',
            text: 'Easy API integration with your apps, CRMs, and workflows.',
          },
          {
            icon: 'shield-halved',
            text: 'Enterprise-grade security, reliability, and support.',
          },
          {
            icon: 'chart-line',
            text: 'Scalable for projects of any size—pay as you grow.',
          },
        ],
      },
      demo: {
        kind: 'trace',
        title: 'models · workflow',
        caption: 'Ready-to-use models chained in one workflow and reached over a secure API.',
        steps: [
          {
            label: 'Extract',
            detail: 'Document extraction and OCR',
          },
          {
            label: 'Classify',
            detail: 'Text classification and sentiment analysis',
          },
          {
            label: 'Chain',
            detail: 'Models combined in an automated workflow',
          },
          {
            label: 'Deploy',
            detail: 'Via secure API, with integration guides',
          },
        ],
      },
    }),
    place('detail.architecture', {
      index: 2,
      label: 'Architecture',
      title: 'Ready-to-use models in your stack',
      layers: [
        {
          label: 'Models',
          nodes: ['NLP & text', 'Vision & image', 'Analytics'],
        },
        {
          label: 'Access',
          nodes: ['Secure API'],
        },
        {
          label: 'Your systems',
          nodes: ['Apps', 'CRMs', 'Workflows'],
        },
      ],
    }),
    place('detail.offerings', {
      index: 3,
      label: 'Use cases',
      offerings: {
        title: 'Popular model categories',
        items: [
          {
            icon: 'language',
            title: 'NLP & text',
            text: 'Text classification, sentiment analysis, entity extraction, summarization, translation, and more.',
          },
          {
            icon: 'image',
            title: 'Vision & image',
            text: 'Image classification, object detection, OCR, face recognition, and visual search.',
          },
          {
            icon: 'chart-bar',
            title: 'Analytics & automation',
            text: 'Forecasting, anomaly detection, document processing, and workflow automation.',
          },
        ],
      },
    }),
    place('detail.faq', {
      index: 4,
      label: 'FAQ',
      title: 'Questions about Ready-to-use AI models',
      items: [
        {
          question: 'What types of ready-to-use models does Exyconn offer?',
          answer:
            'We offer models for NLP (text classification, sentiment, extraction), vision (image classification, OCR), analytics, and more. Contact us for the full catalog.',
        },
        {
          question: 'How do I integrate these models into my app?',
          answer:
            'All models are available via secure API. We provide integration guides and support for your stack.',
        },
        {
          question: 'Can I combine multiple models in a workflow?',
          answer:
            'Yes, you can chain models together or use them as part of automated workflows and business processes.',
        },
        {
          question: 'Are these models secure and compliant?',
          answer:
            'Yes, all models are deployed with enterprise security, privacy, and compliance in mind.',
        },
        {
          question: 'How do I get started with ready-to-use models?',
          answer:
            'Contact Exyconn for a free consultation. We’ll help you select and deploy the best models for your needs.',
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
          href: '/ai/custom-model-training',
          index: 'AI/04',
          title: 'Custom model training',
          text: 'Unlock the power of AI tailored to your business.',
          tags: ['Data preparation', 'Model fine-tuning', 'Deployment & support'],
        },
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
      ],
    }),
    place('detail.cta', {
      family: 'ai',
      label: 'Next step',
      title: 'Start with Ready-to-use AI models',
      text: 'Deploy Proven AI Instantly',
      primary: {
        label: 'See all models',
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
