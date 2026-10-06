import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/automation-integration (formerly exyconn-website/src/pages/[market]/services/automation-integration.astro). */
export const SERVICES_AUTOMATION_INTEGRATION_PAGE: CmsSeedPage = {
  key: 'services-automation-integration',
  path: '/services/automation-integration',
  kind: 'PAGE',
  title: 'Automation & Integration Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Automation & Integration Services | Exyconn',
    description:
      'Automate workflows and integrate your business systems with Exyconn. We deliver end-to-end automation and seamless integration for greater efficiency, accuracy, and growth.',
    keywords:
      'automation, integration, workflow automation, system integration, business automation, Exyconn',
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
            name: 'Automation & integration',
            item: 'https://exyconn.com/{market}/services/automation-integration',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Automation & integration',
        description:
          'Automate workflows and integrate your business systems with Exyconn. We deliver end-to-end automation and seamless integration for greater efficiency, accuracy, and growth.',
        url: 'https://exyconn.com/{market}/services/automation-integration',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Our automation & integration services',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Workflow automation',
              description: 'Automate multi-step business processes and approvals.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'System integration',
              description: 'Connect CRMs, ERPs, cloud apps, and databases for unified operations.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'RPA & bots',
              description: 'Deploy robotic process automation and bots for repetitive tasks.',
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
          label: 'Automation & integration',
          href: '',
        },
      ],
      title: 'Automate workflows and integrate your business systems',
      lede: 'Transform your business with Exyconn’s automation and integration services. We help you automate repetitive tasks, connect your apps and data, and streamline workflows for maximum productivity and growth.',
      primary: {
        label: 'Start automating',
        href: '/contact',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['integration', 'glyph'],
      },
      glyph: 'plug',
      tagline: 'Seamless. Efficient. Connected.',
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What is automation & integration?',
        icon: 'plug-circle-check',
        term: 'Automation & Integration',
        definition:
          'involves connecting your business systems and automating manual processes. We enable seamless data flow, reduce errors, and free your team to focus on high-value work.',
      },
      benefits: {
        title: 'Why choose Exyconn for automation & integration?',
        items: [
          {
            icon: 'gears',
            text: 'Automate repetitive tasks and business workflows.',
          },
          {
            icon: 'plug',
            text: 'Integrate apps, databases, APIs, and cloud platforms.',
          },
          {
            icon: 'chart-line',
            text: 'Boost efficiency, accuracy, and scalability.',
          },
          {
            icon: 'shield-halved',
            text: 'Secure, compliant, and reliable integrations.',
          },
          {
            icon: 'user-check',
            text: 'Custom solutions tailored to your business needs.',
          },
        ],
      },
    }),
    place('detail.offerings', {
      index: 2,
      label: 'What we deliver',
      offerings: {
        title: 'Our automation & integration services',
        items: [
          {
            icon: 'diagram-project',
            title: 'Workflow automation',
            text: 'Automate multi-step business processes and approvals.',
          },
          {
            icon: 'code-merge',
            title: 'System integration',
            text: 'Connect CRMs, ERPs, cloud apps, and databases for unified operations.',
          },
          {
            icon: 'robot',
            title: 'RPA & bots',
            text: 'Deploy robotic process automation and bots for repetitive tasks.',
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
      title: 'Questions about Automation & integration',
      items: [
        {
          question: 'What systems can you integrate?',
          answer:
            'We integrate CRMs, ERPs, cloud apps, databases, APIs, and custom business systems.',
        },
        {
          question: 'Can you automate custom business workflows?',
          answer:
            'Yes, we design and implement automation for a wide range of business processes and approvals.',
        },
        {
          question: 'Is automation secure and compliant?',
          answer:
            'Absolutely. We follow best practices for security, privacy, and regulatory compliance.',
        },
        {
          question: 'Do you provide support after deployment?',
          answer:
            'Yes, we offer ongoing monitoring, support, and optimization for all automation and integration solutions.',
        },
        {
          question: 'How do I get started with automation & integration?',
          answer:
            'Contact Exyconn for a free consultation. We’ll assess your needs and recommend the best automation and integration strategy.',
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
          href: '/services/data-analytics',
          index: 'S/03',
          title: 'Data analytics',
          text: "Transform your data into actionable insights with Exyconn's data analytics services.",
          tags: ['Business intelligence', 'Advanced analytics', 'Data integration'],
        },
        {
          href: '/services/digital-consulting',
          index: 'S/04',
          title: 'Digital consulting',
          text: "Accelerate your digital transformation with Exyconn's digital consulting services.",
          tags: ['Strategy & roadmap', 'AI & automation', 'Implementation & support'],
        },
        {
          href: '/services/enterprise-application',
          index: 'S/05',
          title: 'Enterprise applications',
          text: 'Build, scale, and optimize robust enterprise applications with Exyconn.',
          tags: ['Custom development', 'Integration & modernization', 'Management & support'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with Automation & integration',
      text: 'Seamless. Efficient. Connected.',
      primary: {
        label: 'Start automating',
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
