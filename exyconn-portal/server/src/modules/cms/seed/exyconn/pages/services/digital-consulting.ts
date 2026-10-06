import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/digital-consulting (formerly exyconn-website/src/pages/[market]/services/digital-consulting.astro). */
export const SERVICES_DIGITAL_CONSULTING_PAGE: CmsSeedPage = {
  key: 'services-digital-consulting',
  path: '/services/digital-consulting',
  kind: 'PAGE',
  title: 'Digital Consulting & AI Strategy Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Digital Consulting & AI Strategy Services | Exyconn',
    description:
      "Accelerate your digital transformation with Exyconn's digital consulting services. We help you strategize, implement, and optimize AI, automation, and technology for business growth.",
    keywords:
      'digital consulting, digital transformation, AI strategy, business consulting, technology consulting, Exyconn',
    ogImageUrl:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
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
            name: 'Services',
            item: 'https://exyconn.com/{market}/services',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Digital consulting',
            item: 'https://exyconn.com/{market}/services/digital-consulting',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Digital consulting',
        description:
          "Accelerate your digital transformation with Exyconn's digital consulting services. We help you strategize, implement, and optimize AI, automation, and technology for business growth.",
        url: 'https://exyconn.com/{market}/services/digital-consulting',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Our digital consulting services',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Strategy & roadmap',
              description:
                'Digital strategy, technology roadmap, and change management for your business goals.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'AI & automation',
              description:
                'AI adoption, process automation, and workflow optimization for efficiency and innovation.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Implementation & support',
              description:
                'Technology selection, integration, deployment, and ongoing support for digital solutions.',
            },
          ],
        },
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
          label: 'Services',
          href: '/services',
        },
        {
          label: 'Digital consulting',
          href: '',
        },
      ],
      title: 'Digital consulting that delivers measurable results',
      lede: 'Unlock business value with Exyconn’s digital consulting. We guide your organization through strategy, AI adoption, process automation, and technology transformation—delivering measurable results at every step.',
      primary: {
        label: 'Start your digital journey',
        href: '/contact',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['roadmap', 'glyph'],
      },
      glyph: 'bulb',
      tagline: 'Transform. Innovate. Grow.',
    }),
    place('detail.logos', {
      label: 'Our digital consulting tools',
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
        title: 'What is digital consulting?',
        icon: 'lightbulb',
        term: 'Digital consulting',
        definition:
          'helps organizations leverage technology, data, and AI to solve business challenges, improve efficiency, and drive innovation. Our experts partner with you to design and implement strategies for digital transformation and sustainable growth.',
      },
      benefits: {
        title: 'Why choose Exyconn for digital consulting?',
        items: [
          {
            icon: 'chart-line',
            text: 'Proven strategies for digital transformation and growth.',
          },
          {
            icon: 'brain',
            text: 'Expertise in AI, automation, and emerging technologies.',
          },
          {
            icon: 'users',
            text: 'Collaborative, client-centric approach.',
          },
          {
            icon: 'gears',
            text: 'End-to-end support from strategy to implementation.',
          },
          {
            icon: 'shield-halved',
            text: 'Focus on security, compliance, and measurable ROI.',
          },
        ],
      },
    }),
    place('detail.offerings', {
      index: 2,
      label: 'What we deliver',
      offerings: {
        title: 'Our digital consulting services',
        items: [
          {
            icon: 'compass-drafting',
            title: 'Strategy & roadmap',
            text: 'Digital strategy, technology roadmap, and change management for your business goals.',
          },
          {
            icon: 'robot',
            title: 'AI & automation',
            text: 'AI adoption, process automation, and workflow optimization for efficiency and innovation.',
          },
          {
            icon: 'cloud-arrow-up',
            title: 'Implementation & support',
            text: 'Technology selection, integration, deployment, and ongoing support for digital solutions.',
          },
        ],
      },
    }),
    place('detail.process', {
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
    }),
    place('detail.faq', {
      index: 4,
      label: 'FAQ',
      title: 'Questions about Digital consulting',
      items: [
        {
          question: 'What industries does Exyconn serve?',
          answer:
            'We work with clients across finance, healthcare, retail, manufacturing, logistics, and more—adapting digital strategies to each sector.',
        },
        {
          question: 'How does Exyconn approach digital transformation?',
          answer:
            'We start with a deep assessment of your business, then co-create a strategy and roadmap, followed by implementation and continuous optimization.',
        },
        {
          question: 'Can you help with AI and automation adoption?',
          answer:
            'Yes, we specialize in AI, automation, and process optimization—helping you select, implement, and scale the right solutions.',
        },
        {
          question: 'Is digital consulting only for large enterprises?',
          answer:
            'No, we support organizations of all sizes, from startups to global enterprises, tailoring our approach to your needs and resources.',
        },
        {
          question: 'How do I get started with digital consulting?',
          answer:
            'Contact Exyconn for a free consultation. We’ll discuss your goals and recommend the best path for your digital journey.',
        },
      ],
    }),
    place('detail.related', {
      index: 5,
      label: 'Related services',
      title: 'Explore related services',
      more: 'Explore',
      cards: [
        {
          href: '/services/enterprise-application',
          index: 'S/05',
          title: 'Enterprise applications',
          text: 'Build, scale, and optimize robust enterprise applications with Exyconn.',
          tags: ['Custom development', 'Integration & modernization', 'Management & support'],
        },
        {
          href: '/services/maintenance',
          index: 'S/06',
          title: 'Application maintenance',
          text: "Keep your business applications running smoothly with Exyconn's maintenance services.",
          tags: ['Proactive monitoring', 'Expert support', 'Continuous optimization'],
        },
        {
          href: '/services/mobile-application-development',
          index: 'S/07',
          title: 'Mobile application development',
          text: 'Build high-performance, user-friendly mobile apps for iOS and Android with Exyconn.',
          tags: ['Native app development', 'Cross-platform apps', 'Backend & API integration'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with Digital consulting',
      text: 'Transform. Innovate. Grow.',
      primary: {
        label: 'Start your digital journey',
        href: '/contact',
      },
      secondary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      echoShape: 1,
    }),
  ].join(''),
  css: '',
};
