import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/mobile-application-development (formerly exyconn-website/src/pages/[market]/services/mobile-application-development.astro). */
export const SERVICES_MOBILE_APPLICATION_DEVELOPMENT_PAGE: CmsSeedPage = {
  key: 'services-mobile-application-development',
  path: '/services/mobile-application-development',
  kind: 'PAGE',
  title: 'Mobile Application Development Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Mobile Application Development Services | Exyconn',
    description:
      'Build high-performance, user-friendly mobile apps for iOS and Android with Exyconn. We deliver custom mobile solutions for startups, enterprises, and digital transformation.',
    keywords:
      'mobile app development, iOS app, Android app, cross-platform, mobile solutions, Exyconn',
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
            name: 'Mobile application development',
            item: 'https://exyconn.com/{market}/services/mobile-application-development',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Mobile application development',
        description:
          'Build high-performance, user-friendly mobile apps for iOS and Android with Exyconn. We deliver custom mobile solutions for startups, enterprises, and digital transformation.',
        url: 'https://exyconn.com/{market}/services/mobile-application-development',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Our mobile app services',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Native app development',
              description: 'Custom apps for iOS and Android, optimized for performance and UX.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Cross-platform apps',
              description: 'Build once, deploy everywhere—React Native, Flutter, and more.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Backend & API integration',
              description: 'Connect your app to cloud, databases, and business systems.',
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
          label: 'Mobile application development',
          href: '',
        },
      ],
      title: 'Transform ideas into powerful mobile experiences',
      lede: 'Transform your ideas into powerful mobile experiences. Exyconn designs and develops custom mobile applications for iOS, Android, and cross-platform—delivering seamless performance, security, and user engagement.',
      primary: {
        label: 'Start your mobile project',
        href: '/contact',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['devices', 'glyph'],
      },
      glyph: 'phone',
      tagline: 'Innovative. Scalable. User-Centric.',
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What is mobile application development?',
        icon: 'mobile-screen-button',
        term: 'Mobile application development',
        definition:
          'is the process of creating software apps for smartphones and tablets. We build native and cross-platform apps tailored to your business goals, user needs, and technical requirements.',
      },
      benefits: {
        title: 'Why choose Exyconn for mobile apps?',
        items: [
          {
            icon: 'mobile-screen',
            text: 'Expertise in iOS, Android, and cross-platform frameworks.',
          },
          {
            icon: 'user-check',
            text: 'User-centric design for maximum engagement.',
          },
          {
            icon: 'shield-halved',
            text: 'Secure, scalable, and high-performance solutions.',
          },
          {
            icon: 'gears',
            text: 'Seamless integration with APIs and backend systems.',
          },
          {
            icon: 'rocket',
            text: 'Rapid prototyping and agile delivery.',
          },
        ],
      },
    }),
    place('detail.offerings', {
      index: 2,
      label: 'What we deliver',
      offerings: {
        title: 'Our mobile app services',
        items: [
          {
            icon: 'mobile-alt',
            title: 'Native app development',
            text: 'Custom apps for iOS and Android, optimized for performance and UX.',
          },
          {
            icon: 'layer-group',
            title: 'Cross-platform apps',
            text: 'Build once, deploy everywhere—React Native, Flutter, and more.',
          },
          {
            icon: 'cloud-arrow-up',
            title: 'Backend & API integration',
            text: 'Connect your app to cloud, databases, and business systems.',
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
      title: 'Questions about Mobile application development',
      items: [
        {
          question: 'What platforms do you develop for?',
          answer:
            'We build apps for iOS, Android, and cross-platform using React Native, Flutter, and other modern frameworks.',
        },
        {
          question: 'Can you integrate my app with existing systems?',
          answer:
            'Yes, we specialize in API and backend integration for seamless business workflows.',
        },
        {
          question: 'How do you ensure app security?',
          answer:
            'We follow best practices for secure coding, data protection, and compliance with app store guidelines.',
        },
        {
          question: 'Do you provide post-launch support?',
          answer:
            'Absolutely. We offer maintenance, updates, and feature enhancements for all mobile apps we build.',
        },
        {
          question: 'How do I get started with mobile app development?',
          answer:
            'Contact Exyconn for a free consultation. We’ll discuss your goals and recommend the best mobile strategy for your needs.',
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
          href: '/services/software-as-a-service',
          index: 'S/08',
          title: 'Software as a service (SaaS)',
          text: "Accelerate your business with Exyconn's SaaS solutions.",
          tags: ['SaaS consulting', 'SaaS development', 'SaaS management'],
        },
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
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with Mobile application development',
      text: 'Innovative. Scalable. User-Centric.',
      primary: {
        label: 'Start your mobile project',
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
