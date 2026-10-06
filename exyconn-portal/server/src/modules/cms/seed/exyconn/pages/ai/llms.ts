import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/ai/llms (formerly exyconn-website/src/pages/[market]/ai/llms.astro). */
export const AI_LLMS_PAGE: CmsSeedPage = {
  key: 'ai-llms',
  path: '/ai/llms',
  kind: 'PAGE',
  title: 'Large Language Models (LLMs) | AI Text | Exyconn',
  layout: 'default',
  seo: {
    title: 'Large Language Models (LLMs) | AI Text | Exyconn',
    description:
      'Unlock the power of Large Language Models (LLMs) for your business. Exyconn delivers advanced AI text generation, summarization, chat, and automation solutions using state-of-the-art LLMs.',
    keywords:
      'LLM, Large Language Model, AI text, GPT, Claude, Gemini, text generation, summarization, Exyconn',
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
            name: 'Large language models',
            item: 'https://exyconn.com/{market}/ai/llms',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Large language models',
        description:
          'Unlock the power of Large Language Models (LLMs) for your business. Exyconn delivers advanced AI text generation, summarization, chat, and automation solutions using state-of-the-art LLMs.',
        url: 'https://exyconn.com/{market}/ai/llms',
        serviceType: 'AI',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'LLM use cases',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Conversational AI',
              description: 'Build advanced chatbots, virtual agents, and support assistants.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Content automation',
              description:
                'Generate, summarize, and translate text for marketing, support, and more.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Knowledge & search',
              description: 'Power semantic search, document Q&A, and knowledge management.',
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
          label: 'Large language models',
          href: '',
        },
      ],
      title: 'Large language models, securely and at scale',
      lede: 'Transform your business with advanced Large Language Models. Exyconn helps you leverage LLMs for chatbots, content generation, summarization, automation, and more—securely and at scale.',
      primary: {
        label: 'Explore LLM solutions',
        href: '/contact',
      },
      secondary: {
        label: 'Browse AI services',
        href: '/ai-services',
      },
      scene: {
        shapes: ['tokenStream'],
      },
      glyph: '',
      tagline: 'AI Text Intelligence for Business',
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
        title: 'What are large language models?',
        icon: 'brain',
        term: 'Large Language Models (LLMs)',
        definition:
          'are advanced AI models trained on massive text datasets. They can understand, generate, summarize, and interact in natural language—powering chatbots, content automation, search, and more.',
      },
      benefits: {
        title: 'Why use LLMs for your business?',
        items: [
          {
            icon: 'comments',
            text: 'Enable natural, human-like chatbots and virtual assistants.',
          },
          {
            icon: 'file-lines',
            text: 'Automate content creation, summarization, and translation.',
          },
          {
            icon: 'magnifying-glass',
            text: 'Enhance search, knowledge management, and Q&A systems.',
          },
          {
            icon: 'bolt',
            text: 'Accelerate document processing and business automation.',
          },
          {
            icon: 'lock',
            text: 'Deploy securely—on cloud, private, or on-premises infrastructure.',
          },
        ],
      },
      demo: {
        kind: 'chat',
        title: 'llm · assistant',
        caption: 'Someone asks which LLMs Exyconn supports and the assistant answers.',
        messages: [
          {
            from: 'user',
            text: 'What LLMs does Exyconn support?',
          },
          {
            from: 'agent',
            text: 'We support leading LLMs including OpenAI GPT, Google Gemini, Anthropic Claude, and can deploy open-source models as needed.',
          },
        ],
      },
    }),
    place('detail.architecture', {
      index: 2,
      label: 'Architecture',
      title: 'Where LLMs sit in your business',
      layers: [
        {
          label: 'Use cases',
          nodes: ['Chatbots', 'Content', 'Search & Q&A'],
        },
        {
          label: 'Models',
          nodes: ['OpenAI GPT', 'Google Gemini', 'Anthropic Claude', 'Open-source'],
        },
        {
          label: 'Adaptation',
          nodes: ['Fine-tuning', 'Prompt engineering'],
        },
        {
          label: 'Deployment',
          nodes: ['Cloud', 'Private cloud', 'On-premises'],
        },
      ],
    }),
    place('detail.offerings', {
      index: 3,
      label: 'Use cases',
      offerings: {
        title: 'LLM use cases',
        items: [
          {
            icon: 'robot',
            title: 'Conversational AI',
            text: 'Build advanced chatbots, virtual agents, and support assistants.',
          },
          {
            icon: 'file-pen',
            title: 'Content automation',
            text: 'Generate, summarize, and translate text for marketing, support, and more.',
          },
          {
            icon: 'database',
            title: 'Knowledge & search',
            text: 'Power semantic search, document Q&A, and knowledge management.',
          },
        ],
      },
    }),
    place('detail.tabs', {
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
    }),
    place('detail.faq', {
      index: 5,
      label: 'FAQ',
      title: 'Questions about Large language models',
      items: [
        {
          question: 'What LLMs does Exyconn support?',
          answer:
            'We support leading LLMs including OpenAI GPT, Google Gemini, Anthropic Claude, and can deploy open-source models as needed.',
        },
        {
          question: 'Can LLMs be fine-tuned for my business?',
          answer:
            'Yes, we offer custom fine-tuning and prompt engineering to adapt LLMs for your industry, data, and workflows.',
        },
        {
          question: 'Is my data secure when using LLMs?',
          answer:
            'We offer secure deployment options, including private cloud and on-premises, to keep your data safe and compliant.',
        },
        {
          question: 'What are common LLM use cases?',
          answer:
            'LLMs are used for chatbots, content generation, summarization, translation, semantic search, document Q&A, and more.',
        },
        {
          question: 'How do I get started with LLMs for my business?',
          answer:
            'Contact Exyconn for a free consultation. We’ll assess your needs and recommend the best LLM solution for your goals.',
        },
      ],
    }),
    place('detail.related', {
      index: 6,
      label: 'More AI capabilities',
      title: 'Keep exploring AI',
      more: 'Explore',
      cards: [
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
        {
          href: '/ai/mcp-server',
          index: 'AI/05',
          title: 'MCP server',
          text: "Explore Exyconn's MCP Server: a Model Context Protocol platform for orchestrating AI agents, managing multi-channel workflows, and automating business processes with context-aware intelligence.",
          tags: ['Context-aware orchestration', 'AI agent management', 'Seamless integration'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'ai',
      label: 'Next step',
      title: 'Start with Large language models',
      text: 'AI Text Intelligence for Business',
      primary: {
        label: 'Explore LLM solutions',
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
