import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/data-analytics (formerly exyconn-website/src/pages/[market]/services/data-analytics.astro). */
export const SERVICES_DATA_ANALYTICS_PAGE: CmsSeedPage = {
  key: 'services-data-analytics',
  path: '/services/data-analytics',
  kind: 'PAGE',
  title: 'Data Analytics & Business Insights Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Data Analytics & Business Insights Services | Exyconn',
    description:
      "Transform your data into actionable insights with Exyconn's data analytics services. We help you collect, analyze, visualize, and leverage data for smarter business decisions.",
    keywords:
      'data analytics, business intelligence, data visualization, analytics consulting, Exyconn',
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
            name: 'Data analytics',
            item: 'https://exyconn.com/{market}/services/data-analytics',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Data analytics',
        description:
          "Transform your data into actionable insights with Exyconn's data analytics services. We help you collect, analyze, visualize, and leverage data for smarter business decisions.",
        url: 'https://exyconn.com/{market}/services/data-analytics',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Our data analytics services',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Business intelligence',
              description: 'Dashboards, KPIs, and reporting for real-time business insights.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Advanced analytics',
              description: 'Predictive analytics, machine learning, and data mining.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Data integration',
              description: 'Connect and unify data from multiple sources for a complete view.',
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
          label: 'Data analytics',
          href: '',
        },
      ],
      title: 'Transform your data into actionable insights',
      lede: 'Leverage the power of your data with Exyconn’s analytics services. We help you collect, analyze, and visualize data to uncover trends, optimize operations, and make smarter business decisions.',
      primary: {
        label: 'Start your analytics journey',
        href: '/contact',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['dataflow', 'glyph'],
      },
      glyph: 'chart',
      tagline: 'Unlock Insights. Drive Decisions.',
    }),
    place('detail.logos', {
      label: 'Analytics tools',
      logos: [
        {
          name: 'Adobe Analytics',
          src: 'https://improvado.io/5a1eb87c9afe1000014a4c7d/64e351d1fc727d1651281ecd_646cbd27e444c08356e0a1c3_adobe-analytics-adobe-experience-cloud.png',
          width: 580,
          height: 242,
        },
      ],
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What is data analytics?',
        icon: 'chart-bar',
        term: 'Data analytics',
        definition:
          'is the process of examining raw data to find trends, patterns, and actionable insights. We turn your business data into a strategic asset—fueling growth, efficiency, and innovation.',
      },
      benefits: {
        title: 'Why choose Exyconn for data analytics?',
        items: [
          {
            icon: 'database',
            text: 'Expertise in data collection, cleaning, and integration.',
          },
          {
            icon: 'chart-line',
            text: 'Advanced analytics and predictive modeling.',
          },
          {
            icon: 'eye',
            text: 'Interactive dashboards and data visualization.',
          },
          {
            icon: 'gears',
            text: 'Seamless integration with your business systems.',
          },
          {
            icon: 'user-check',
            text: 'Actionable insights for better decision-making.',
          },
        ],
      },
    }),
    place('detail.offerings', {
      index: 2,
      label: 'What we deliver',
      offerings: {
        title: 'Our data analytics services',
        items: [
          {
            icon: 'magnifying-glass-chart',
            title: 'Business intelligence',
            text: 'Dashboards, KPIs, and reporting for real-time business insights.',
          },
          {
            icon: 'chart-pie',
            title: 'Advanced analytics',
            text: 'Predictive analytics, machine learning, and data mining.',
          },
          {
            icon: 'diagram-project',
            title: 'Data integration',
            text: 'Connect and unify data from multiple sources for a complete view.',
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
      title: 'Questions about Data analytics',
      items: [
        {
          question: 'What analytics platforms do you support?',
          answer:
            'We work with Power BI, Tableau, Looker, Google Data Studio, and custom analytics stacks.',
        },
        {
          question: 'Can you integrate data from multiple sources?',
          answer:
            'Yes, we specialize in data integration from CRMs, ERPs, cloud apps, databases, and more.',
        },
        {
          question: 'Do you provide predictive analytics and AI?',
          answer:
            'Absolutely. We offer advanced analytics, machine learning, and AI-driven insights tailored to your business.',
        },
        {
          question: 'How do you ensure data security and privacy?',
          answer:
            'We follow best practices for data governance, privacy, and compliance throughout every analytics project.',
        },
        {
          question: 'How do I get started with data analytics?',
          answer:
            'Contact Exyconn for a free consultation. We’ll assess your data and recommend the best analytics strategy for your needs.',
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
        {
          href: '/services/maintenance',
          index: 'S/06',
          title: 'Application maintenance',
          text: "Keep your business applications running smoothly with Exyconn's maintenance services.",
          tags: ['Proactive monitoring', 'Expert support', 'Continuous optimization'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with Data analytics',
      text: 'Unlock Insights. Drive Decisions.',
      primary: {
        label: 'Start your analytics journey',
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
