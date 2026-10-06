import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services (formerly exyconn-website/src/pages/[market]/services/index.astro). */
export const SERVICES_HUB_PAGE: CmsSeedPage = {
  key: 'services',
  path: '/services',
  kind: 'PAGE',
  title: 'Our Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Our Services | Exyconn',
    description:
      'Explore all digital, automation, analytics, SaaS, and mobile services offered by Exyconn. Transform your business with our comprehensive solutions.',
    keywords:
      'digital services, automation, SaaS, mobile development, enterprise applications, data analytics, Exyconn',
    ogImageUrl:
      'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&w=1200&q=80',
    canonical: '',
    noindex: false,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://exyconn.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Services',
        },
      ],
    },
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
          href: '',
        },
      ],
      title: 'Software that builds, modernises and grows',
      lede: 'From digital transformation to AI automation, we provide end-to-end services to help your business thrive in the digital era.',
      primary: {
        label: 'Get started',
        href: '/contact',
      },
      secondary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      scene: {
        shapes: ['lattice'],
        data: {
          lattice: {
            clusters: 3,
          },
        },
      },
      glyph: '',
      tagline: '',
    }),
    place('detail.proof', {
      label: 'Services at a glance',
      items: [
        {
          value: '11',
          label: 'Services',
        },
        {
          value: '50+',
          label: 'Projects delivered',
        },
        {
          value: '100%',
          label: 'Client satisfaction',
        },
        {
          value: '24/7',
          label: 'Support available',
        },
      ],
    }),
    place('service.grouped-cards', {
      index: 1,
      id: 'pillars',
      label: 'Pillars',
      title: 'Three ways we move your business',
      lede: 'Pick the pillar that matches where you are. Each service page shows what we deliver and how we work.',
      more: 'Explore',
      highlight: true,
      groups: [
        {
          id: 'build',
          label: 'Build',
          title: 'Build what is next',
          text: 'Powerful applications for web and mobile, built by a team that owns the outcome.',
          cards: [
            {
              href: '/services/software-development-outsourcing',
              title: 'Software development outsourcing',
              text: 'Access top talent and accelerate delivery with flexible engagement models.',
              tags: ['Dedicated teams', 'Augmentation', 'Delivery'],
              index: 'B/01',
            },
            {
              href: '/services/mobile-application-development',
              title: 'Mobile application development',
              text: 'High-performance, user-friendly mobile apps for iOS and Android.',
              tags: ['iOS', 'Android', 'Cross-platform'],
              index: 'B/02',
            },
            {
              href: '/services/enterprise-application',
              title: 'Enterprise application',
              text: 'Build, scale and optimise robust enterprise applications.',
              tags: ['Secure', 'High-performance', 'Large-scale'],
              index: 'B/03',
            },
            {
              href: '/services/software-as-a-service',
              title: 'Software as a service',
              text: 'Scalable, secure and innovative SaaS, designed, built and managed.',
              tags: ['Cloud', 'Multi-tenant', 'Managed'],
              index: 'B/04',
            },
          ],
        },
        {
          id: 'modernise',
          label: 'Modernise',
          title: 'Modernise what runs',
          text: 'Upgrade legacy systems, connect what is siloed and keep it all running smoothly.',
          cards: [
            {
              href: '/services/application-modernization',
              title: 'Application modernization',
              text: 'Upgrade legacy systems for performance, security and innovation.',
              tags: ['Migration', 'Legacy', 'Performance'],
              index: 'M/01',
            },
            {
              href: '/services/automation-integration',
              title: 'Automation & integration',
              text: 'Automate workflows and integrate your business systems for efficiency.',
              tags: ['Workflows', 'APIs', 'Integration'],
              index: 'M/02',
            },
            {
              href: '/services/whatsapp-chatbot',
              title: 'WhatsApp chatbot',
              text: 'Book, sell and support customers inside WhatsApp — try the live demo.',
              tags: ['WhatsApp', 'Chatbots', 'Live demo'],
              index: 'M/03',
            },
            {
              href: '/services/maintenance',
              title: 'Maintenance & support',
              text: 'Keep your applications running smoothly with proactive support.',
              tags: ['Monitoring', 'Updates', 'Support'],
              index: 'M/04',
            },
          ],
        },
        {
          id: 'grow',
          label: 'Grow',
          title: 'Grow what works',
          text: 'Unlock insights, sharpen the strategy and turn traffic into revenue.',
          cards: [
            {
              href: '/services/data-analytics',
              title: 'Data analytics',
              text: 'Turn your data into actionable insights for smarter decisions.',
              tags: ['BI', 'Visualisation', 'Insights'],
              index: 'G/01',
            },
            {
              href: '/services/digital-consulting',
              title: 'Digital consulting',
              text: 'Accelerate your digital transformation with strategy and technology consulting.',
              tags: ['Strategy', 'AI', 'Transformation'],
              index: 'G/02',
            },
            {
              href: '/services/digital-marketing',
              title: 'Digital marketing',
              text: 'Grow brand, traffic and revenue with full-funnel marketing services.',
              tags: ['SEO', 'Paid media', 'CRO'],
              index: 'G/03',
            },
          ],
        },
      ],
    }),
    place('service.steps', {
      index: 2,
      id: 'lifecycle',
      label: 'Lifecycle',
      title: 'With you across the whole lifecycle',
      highlight: false,
      steps: [
        {
          title: 'Ideation',
          text: 'Validate and enhance product ideas with our domain and technology expertise.',
        },
        {
          title: 'Development & launch',
          text: 'Optimise development costs with stable, predictable delivery via shared ownership.',
        },
        {
          title: 'Growth & maturity',
          text: 'Supercharge growth and operational efficiency with delivery ownership transfer.',
        },
        {
          title: 'End of life',
          text: 'Optimise costs and enable demand throttling with portfolio ownership transfer.',
        },
      ],
    }),
    place('service.related-hubs', {
      index: 3,
      label: 'Explore',
      title: 'AI, platform and the full portfolio',
      links: [
        {
          href: '/our-services',
          title: 'Our service pillars',
          text: 'AI platform services, SaaS development and enterprise consulting.',
          more: 'See the pillars',
        },
        {
          href: '/exyconn-services',
          title: 'Infrastructure platform',
          text: 'Email, payments, logs, themes, translations and more — all in one place.',
          more: 'See the platform',
        },
        {
          href: '/ai',
          title: 'AI platform',
          text: 'Agents, models, workflows and MCP infrastructure, production-ready.',
          more: 'Explore AI',
        },
        {
          href: '/ai-services',
          title: 'AI services catalogue',
          text: 'Every AI product and build service we offer, by capability area.',
          more: 'Open the catalogue',
        },
      ],
      featured: {
        href: '',
        title: '',
        text: '',
        more: '',
      },
    }),
    place('detail.cta', {
      family: 'services',
      label: '',
      title: 'Ready to transform your business?',
      text: "Let's discuss how our services can help you achieve your business goals. Schedule a free consultation today.",
      primary: {
        label: 'Schedule consultation',
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
