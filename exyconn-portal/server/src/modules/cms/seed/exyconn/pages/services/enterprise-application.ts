import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/enterprise-application (formerly exyconn-website/src/pages/[market]/services/enterprise-application.astro). */
export const SERVICES_ENTERPRISE_APPLICATION_PAGE: CmsSeedPage = {
  key: 'services-enterprise-application',
  path: '/services/enterprise-application',
  kind: 'PAGE',
  title: 'Enterprise Application Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Enterprise Application Services | Exyconn',
    description:
      'Build, scale, and optimize robust enterprise applications with Exyconn. We deliver secure, high-performance solutions tailored for complex business needs and large-scale operations.',
    keywords:
      'enterprise application, business software, enterprise solutions, scalable apps, provider services, Exyconn',
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
            name: 'Enterprise applications',
            item: 'https://exyconn.com/{market}/services/enterprise-application',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Enterprise applications',
        description:
          'Build, scale, and optimize robust enterprise applications with Exyconn. We deliver secure, high-performance solutions tailored for complex business needs and large-scale operations.',
        url: 'https://exyconn.com/{market}/services/enterprise-application',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Our enterprise application services',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Custom development',
              description:
                'Design and build tailored enterprise applications for your unique business processes.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Integration & modernization',
              description:
                'Integrate with existing systems and modernize legacy applications for better performance.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Management & support',
              description:
                'Ongoing maintenance, monitoring, and optimization for enterprise-grade reliability.',
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
          label: 'Enterprise applications',
          href: '',
        },
      ],
      title: 'Robust, secure, scalable enterprise applications',
      lede: 'Empower your organization with robust, secure, and scalable enterprise applications. Exyconn designs, develops, and manages mission-critical solutions for large-scale business operations and complex workflows.',
      primary: {
        label: 'Start your enterprise project',
        href: '/contact',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['city', 'glyph'],
      },
      glyph: 'building',
      tagline: 'Robust. Scalable. Enterprise-Grade.',
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What are enterprise applications?',
        icon: 'building',
        term: 'Enterprise applications',
        definition:
          'are large-scale software systems designed to support complex business processes, integrate with multiple systems, and deliver high performance, security, and reliability for organizations of any size.',
      },
      benefits: {
        title: 'Why choose Exyconn for enterprise applications?',
        items: [
          {
            icon: 'layer-group',
            text: 'Robust architecture for mission-critical operations.',
          },
          {
            icon: 'shield-halved',
            text: 'Enterprise-grade security, compliance, and governance.',
          },
          {
            icon: 'gears',
            text: 'Custom integrations with ERPs, CRMs, and business platforms.',
          },
          {
            icon: 'chart-line',
            text: 'Scalable solutions for growing business needs.',
          },
          {
            icon: 'users',
            text: 'End-to-end support from consulting to managed services.',
          },
        ],
      },
    }),
    place('detail.offerings', {
      index: 2,
      label: 'What we deliver',
      offerings: {
        title: 'Our enterprise application services',
        items: [
          {
            icon: 'diagram-project',
            title: 'Custom development',
            text: 'Design and build tailored enterprise applications for your unique business processes.',
          },
          {
            icon: 'plug',
            title: 'Integration & modernization',
            text: 'Integrate with existing systems and modernize legacy applications for better performance.',
          },
          {
            icon: 'shield-halved',
            title: 'Management & support',
            text: 'Ongoing maintenance, monitoring, and optimization for enterprise-grade reliability.',
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
      title: 'Questions about Enterprise applications',
      items: [
        {
          question: 'What types of enterprise applications does Exyconn build?',
          answer:
            'We build ERP, CRM, HRM, supply chain, analytics, and custom business applications tailored to your needs.',
        },
        {
          question: 'Can you integrate with our existing systems?',
          answer:
            'Yes, we specialize in seamless integration with ERPs, CRMs, databases, and cloud platforms.',
        },
        {
          question: 'How do you ensure security and compliance?',
          answer:
            'Our solutions follow best practices for security, data privacy, and industry compliance standards.',
        },
        {
          question: 'Do you provide ongoing support and management?',
          answer:
            'Absolutely. We offer managed services, monitoring, and continuous optimization for all enterprise applications.',
        },
        {
          question: 'How do I get started with enterprise application services?',
          answer:
            'Contact Exyconn for a free consultation. We’ll assess your requirements and recommend the best solution for your enterprise.',
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
        {
          href: '/services/software-as-a-service',
          index: 'S/08',
          title: 'Software as a service (SaaS)',
          text: "Accelerate your business with Exyconn's SaaS solutions.",
          tags: ['SaaS consulting', 'SaaS development', 'SaaS management'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with Enterprise applications',
      text: 'Robust. Scalable. Enterprise-Grade.',
      primary: {
        label: 'Start your enterprise project',
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
