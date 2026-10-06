import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/application-modernization (formerly exyconn-website/src/pages/[market]/services/application-modernization.astro). */
export const SERVICES_APPLICATION_MODERNIZATION_PAGE: CmsSeedPage = {
  key: 'services-application-modernization',
  path: '/services/application-modernization',
  kind: 'PAGE',
  title: 'Application Modernization Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Application Modernization Services | Exyconn',
    description:
      "Upgrade your legacy systems for performance, security, and innovation. Exyconn's application modernization services help you transform, migrate, and optimize business-critical applications.",
    keywords:
      'application modernization, legacy system upgrade, app migration, modernization consulting, Exyconn',
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
            name: 'Application modernization',
            item: 'https://exyconn.com/{market}/services/application-modernization',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Application modernization',
        description:
          "Upgrade your legacy systems for performance, security, and innovation. Exyconn's application modernization services help you transform, migrate, and optimize business-critical applications.",
        url: 'https://exyconn.com/{market}/services/application-modernization',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Our application modernization services',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Legacy assessment',
              description: 'Evaluate your current systems and define a modernization roadmap.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Migration & refactoring',
              description: 'Migrate apps to cloud, refactor code, and adopt modern architectures.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Security & optimization',
              description:
                'Enhance security, performance, and maintainability for long-term value.',
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
          label: 'Application modernization',
          href: '',
        },
      ],
      title: 'Modernize legacy applications and reduce technical debt',
      lede: 'Modernize your legacy applications for better performance, security, and scalability. Exyconn helps you migrate, refactor, and optimize business-critical systems—unlocking innovation and reducing technical debt.',
      primary: {
        label: 'Start your modernization',
        href: '/contact',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['modernize', 'glyph'],
      },
      glyph: 'rotate',
      tagline: 'Upgrade. Secure. Transform.',
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What is application modernization?',
        icon: 'arrows-rotate',
        term: 'Application modernization',
        definition:
          'is the process of updating legacy software to modern architectures, platforms, and technologies. This improves performance, security, maintainability, and enables integration with new digital solutions.',
      },
      benefits: {
        title: 'Why modernize your applications?',
        items: [
          {
            icon: 'gauge-high',
            text: 'Boost performance and reliability for business-critical apps.',
          },
          {
            icon: 'shield-halved',
            text: 'Enhance security and compliance to reduce risk.',
          },
          {
            icon: 'cloud-arrow-up',
            text: 'Enable cloud migration and integration with modern platforms.',
          },
          {
            icon: 'gears',
            text: 'Reduce technical debt and maintenance costs.',
          },
          {
            icon: 'lightbulb',
            text: 'Unlock innovation and support digital transformation.',
          },
        ],
      },
    }),
    place('detail.offerings', {
      index: 2,
      label: 'What we deliver',
      offerings: {
        title: 'Our application modernization services',
        items: [
          {
            icon: 'database',
            title: 'Legacy assessment',
            text: 'Evaluate your current systems and define a modernization roadmap.',
          },
          {
            icon: 'code-compare',
            title: 'Migration & refactoring',
            text: 'Migrate apps to cloud, refactor code, and adopt modern architectures.',
          },
          {
            icon: 'shield-halved',
            title: 'Security & optimization',
            text: 'Enhance security, performance, and maintainability for long-term value.',
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
      title: 'Questions about Application modernization',
      items: [
        {
          question: 'What types of legacy systems can Exyconn modernize?',
          answer:
            'We modernize a wide range of legacy applications, including mainframe, desktop, web, and custom business systems.',
        },
        {
          question: 'Can you migrate my apps to the cloud?',
          answer:
            'Yes, we specialize in cloud migration, refactoring, and re-platforming to AWS, Azure, Google Cloud, and private clouds.',
        },
        {
          question: 'How do you ensure security during modernization?',
          answer:
            'We follow best practices for secure migration, data protection, and compliance throughout the modernization process.',
        },
        {
          question: 'Will there be downtime during migration?',
          answer:
            'We plan migrations to minimize downtime and disruption, using phased and parallel approaches where possible.',
        },
        {
          question: 'How do I get started with application modernization?',
          answer:
            'Contact Exyconn for a free consultation. We’ll assess your legacy systems and recommend the best modernization strategy.',
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
          href: '/services/automation-integration',
          index: 'S/02',
          title: 'Automation & integration',
          text: 'Automate workflows and integrate your business systems with Exyconn.',
          tags: ['Workflow automation', 'System integration', 'RPA & bots'],
        },
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
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with Application modernization',
      text: 'Upgrade. Secure. Transform.',
      primary: {
        label: 'Start your modernization',
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
