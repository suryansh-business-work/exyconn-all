import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/software-as-a-service (formerly exyconn-website/src/pages/[market]/services/software-as-a-service.astro). */
export const SERVICES_SOFTWARE_AS_A_SERVICE_PAGE: CmsSeedPage = {
  key: 'services-software-as-a-service',
  path: '/services/software-as-a-service',
  kind: 'PAGE',
  title: 'Software as a Service (SaaS) Solutions | Exyconn',
  layout: 'default',
  seo: {
    title: 'Software as a Service (SaaS) Solutions | Exyconn',
    description:
      "Accelerate your business with Exyconn's SaaS solutions. We design, build, and manage scalable, secure, and innovative cloud software for modern enterprises.",
    keywords:
      'SaaS, software as a service, cloud software, SaaS development, SaaS consulting, Exyconn',
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
            name: 'Software as a service (SaaS)',
            item: 'https://exyconn.com/{market}/services/software-as-a-service',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Software as a service (SaaS)',
        description:
          "Accelerate your business with Exyconn's SaaS solutions. We design, build, and manage scalable, secure, and innovative cloud software for modern enterprises.",
        url: 'https://exyconn.com/{market}/services/software-as-a-service',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Our SaaS services',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'SaaS consulting',
              description: 'Strategy, architecture, and roadmap for SaaS success.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'SaaS development',
              description: 'Custom cloud software, integrations, and API platforms.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'SaaS management',
              description: 'Ongoing support, monitoring, and optimization for your SaaS apps.',
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
          label: 'Software as a service (SaaS)',
          href: '',
        },
      ],
      title: 'Scalable, secure, cloud-native SaaS solutions',
      lede: 'Transform your business with Exyconn’s SaaS expertise. We help you design, develop, and scale cloud-based software that delivers value, flexibility, and innovation to your users.',
      primary: {
        label: 'Start your SaaS project',
        href: '/contact',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['cloudStack', 'glyph'],
      },
      glyph: 'cloud',
      tagline: 'Scalable. Secure. Cloud-Native.',
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What is SaaS?',
        icon: 'cloud',
        term: 'Software as a Service (SaaS)',
        definition:
          'delivers applications over the internet as a service. Instead of installing and maintaining software, users access it via the cloud—enabling rapid deployment, lower costs, and seamless updates.',
      },
      benefits: {
        title: 'Why choose Exyconn for SaaS?',
        items: [
          {
            icon: 'cloud-arrow-up',
            text: 'Cloud-native architecture for scalability and reliability.',
          },
          {
            icon: 'lock',
            text: 'Enterprise-grade security and compliance.',
          },
          {
            icon: 'gears',
            text: 'Custom SaaS development and integration.',
          },
          {
            icon: 'rocket',
            text: 'Rapid go-to-market and continuous delivery.',
          },
          {
            icon: 'chart-line',
            text: 'Analytics, automation, and AI built in.',
          },
        ],
      },
    }),
    place('detail.offerings', {
      index: 2,
      label: 'What we deliver',
      offerings: {
        title: 'Our SaaS services',
        items: [
          {
            icon: 'lightbulb',
            title: 'SaaS consulting',
            text: 'Strategy, architecture, and roadmap for SaaS success.',
          },
          {
            icon: 'code',
            title: 'SaaS development',
            text: 'Custom cloud software, integrations, and API platforms.',
          },
          {
            icon: 'shield-halved',
            title: 'SaaS management',
            text: 'Ongoing support, monitoring, and optimization for your SaaS apps.',
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
      title: 'Questions about Software as a service (SaaS)',
      items: [
        {
          question: 'What types of SaaS solutions does Exyconn build?',
          answer:
            'We build SaaS for CRM, ERP, analytics, collaboration, automation, and industry-specific needs—customized for your business.',
        },
        {
          question: "How secure are Exyconn's SaaS platforms?",
          answer:
            'Our SaaS solutions follow best practices for security, encryption, and compliance with industry standards.',
        },
        {
          question: 'Can you migrate my legacy app to SaaS?',
          answer:
            'Yes, we offer modernization and migration services to move your legacy software to a modern SaaS platform.',
        },
        {
          question: 'Do you provide ongoing SaaS support?',
          answer:
            'Absolutely. We offer managed services, monitoring, and continuous improvement for your SaaS applications.',
        },
        {
          question: 'How do I get started with SaaS for my business?',
          answer:
            'Contact Exyconn for a free consultation. We’ll discuss your goals and recommend the best SaaS approach for your needs.',
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
          href: '/services/whatsapp-chatbot',
          index: 'S/09',
          title: 'WhatsApp chatbot',
          text: 'Exyconn builds WhatsApp Business chatbots that book appointments, take orders, qualify leads and answer support around the clock on the official WhatsApp Cloud API.',
          tags: [
            'Bookings & appointments',
            'Ordering & catalogue',
            'Lead qualification',
            'Customer support',
            'Notifications & reminders',
            'Integrations',
          ],
        },
        {
          href: '/services/application-modernization',
          index: 'S/01',
          title: 'Application modernization',
          text: 'Upgrade your legacy systems for performance, security, and innovation.',
          tags: ['Legacy assessment', 'Migration & refactoring', 'Security & optimization'],
        },
        {
          href: '/services/automation-integration',
          index: 'S/02',
          title: 'Automation & integration',
          text: 'Automate workflows and integrate your business systems with Exyconn.',
          tags: ['Workflow automation', 'System integration', 'RPA & bots'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with Software as a service (SaaS)',
      text: 'Scalable. Secure. Cloud-Native.',
      primary: {
        label: 'Start your SaaS project',
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
