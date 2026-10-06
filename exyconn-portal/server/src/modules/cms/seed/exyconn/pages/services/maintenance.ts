import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/maintenance (formerly exyconn-website/src/pages/[market]/services/maintenance.astro). */
export const SERVICES_MAINTENANCE_PAGE: CmsSeedPage = {
  key: 'services-maintenance',
  path: '/services/maintenance',
  kind: 'PAGE',
  title: 'Application Maintenance & Support Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Application Maintenance & Support Services | Exyconn',
    description:
      "Keep your business applications running smoothly with Exyconn's maintenance services. We provide proactive support, updates, monitoring, and optimization for enterprise and custom apps.",
    keywords:
      'application maintenance, app support, software maintenance, managed services, Exyconn',
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
            name: 'Application maintenance',
            item: 'https://exyconn.com/{market}/services/maintenance',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Application maintenance',
        description:
          "Keep your business applications running smoothly with Exyconn's maintenance services. We provide proactive support, updates, monitoring, and optimization for enterprise and custom apps.",
        url: 'https://exyconn.com/{market}/services/maintenance',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Why choose Exyconn for maintenance?',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Proactive monitoring',
              description:
                'Continuous monitoring to detect and resolve issues before they impact your business.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Expert support',
              description: 'Experienced team for troubleshooting, updates, and compliance.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Continuous optimization',
              description:
                'Regular performance reviews and improvements to keep your apps running at their best.',
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
          label: 'Application maintenance',
          href: '',
        },
      ],
      title: 'Keep your business applications running smoothly',
      lede: 'Ensure your business applications are secure, up-to-date, and high-performing. Exyconn provides comprehensive maintenance services—including monitoring, updates, bug fixes, and optimization—to maximize uptime and business value.',
      primary: {
        label: 'Get maintenance support',
        href: '/contact',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['ops', 'glyph'],
      },
      glyph: 'cog',
      tagline: 'Reliable. Proactive. Always On.',
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'Why application maintenance?',
        icon: 'screwdriver-wrench',
        term: 'Application maintenance',
        definition:
          'ensures your software stays secure, reliable, and aligned with evolving business needs. We handle updates, bug fixes, performance tuning, and enhancements—so you can focus on growth.',
      },
      benefits: {
        title: 'Our maintenance services include',
        items: [
          {
            icon: 'shield-halved',
            text: 'Security updates and vulnerability patching.',
          },
          {
            icon: 'bug',
            text: 'Bug fixes and issue resolution.',
          },
          {
            icon: 'gauge-high',
            text: 'Performance monitoring and optimization.',
          },
          {
            icon: 'gears',
            text: 'Feature enhancements and minor upgrades.',
          },
          {
            icon: 'headset',
            text: '24/7 support and incident management.',
          },
        ],
      },
    }),
    place('detail.offerings', {
      index: 2,
      label: 'What we deliver',
      offerings: {
        title: 'Why choose Exyconn for maintenance?',
        items: [
          {
            icon: 'clock-rotate-left',
            title: 'Proactive monitoring',
            text: 'Continuous monitoring to detect and resolve issues before they impact your business.',
          },
          {
            icon: 'user-shield',
            title: 'Expert support',
            text: 'Experienced team for troubleshooting, updates, and compliance.',
          },
          {
            icon: 'chart-line',
            title: 'Continuous optimization',
            text: 'Regular performance reviews and improvements to keep your apps running at their best.',
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
      title: 'Questions about Application maintenance',
      items: [
        {
          question: 'What types of applications do you maintain?',
          answer:
            'We support enterprise, custom, web, and mobile applications across a wide range of industries and platforms.',
        },
        {
          question: 'Do you offer 24/7 support?',
          answer:
            'Yes, we provide round-the-clock monitoring and incident response to ensure your applications are always available.',
        },
        {
          question: 'Can you maintain legacy systems?',
          answer:
            'Absolutely. We have experience supporting and modernizing legacy applications as well as new solutions.',
        },
        {
          question: 'How do you handle security updates?',
          answer:
            'We proactively monitor for vulnerabilities and apply security patches and updates as soon as they are available.',
        },
        {
          question: 'How do I get started with application maintenance?',
          answer:
            'Contact Exyconn for a free consultation. We’ll assess your applications and recommend the best maintenance plan for your needs.',
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
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with Application maintenance',
      text: 'Reliable. Proactive. Always On.',
      primary: {
        label: 'Get maintenance support',
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
