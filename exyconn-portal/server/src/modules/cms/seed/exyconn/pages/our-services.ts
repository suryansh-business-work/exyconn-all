import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/our-services (formerly src/pages/[market]/our-services.astro): the pillars, the
 * portfolio, the other hubs and the closing call.
 */
export const OUR_SERVICES_PAGE: CmsSeedPage = {
  key: 'our-services',
  path: '/our-services',
  kind: 'PAGE',
  title: 'AI & SaaS Services | Enterprise Solutions | Exyconn',
  layout: 'default',
  seo: {
    title: 'AI & SaaS Services | Enterprise Solutions | Exyconn',
    description:
      "Transform your enterprise with Exyconn's AI automation, agentic AI, and SaaS solutions. From strategy to deployment—we deliver production-ready intelligent systems.",
    keywords:
      'AI services, enterprise AI, SaaS solutions, AI automation, agentic AI, business transformation, Exyconn',
    ogImageUrl:
      'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&w=1200&q=80',
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
          item: '{siteUrl}/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Our services',
        },
      ],
    },
  },
  html: [
    place('company.stage', {
      family: 'services',
      variant: 'hero',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'Our services',
          href: '',
        },
      ],
      title: 'Services that transform business',
      lede: 'From AI strategy to SaaS deployment, we provide end-to-end services that turn intelligent automation into competitive advantage.',
      primary: {
        label: 'Schedule consultation',
        href: '/contact',
        external: false,
      },
      secondary: {
        label: 'View case studies',
        href: '/case-studies',
        external: false,
      },
      scene: {
        shapes: ['aiChip'],
        data: {
          aiChip: {
            pads: 9,
          },
        },
      },
      globeFromMarkets: false,
    }),
    place(
      'company.chapter',
      {
        index: 1,
        id: 'pillars',
        label: 'Pillars',
        title: 'Three interconnected pillars',
        lede: 'Three pillars that power your digital transformation journey.',
      },
      [
        place('company.info-grid', {
          items: [
            {
              title: 'AI platform services',
              text: 'Deploy production-ready AI systems that automate, analyze and accelerate.',
              points: [
                'Agentic AI & autonomous agents',
                'Custom LLM training & fine-tuning',
                'AI workflow automation',
                'Intelligent bot development',
                'MCP server architecture',
              ],
              link: {
                label: 'Explore the AI platform',
                href: '/ai',
              },
            },
            {
              title: 'SaaS development',
              text: 'Build and scale cloud-native software with enterprise security.',
              points: [
                'Custom SaaS platform development',
                'Cloud architecture & migration',
                'API & integration services',
                'Multi-tenant architecture',
                'DevOps & CI/CD pipelines',
              ],
              link: {
                label: 'Explore SaaS development',
                href: '/services/software-as-a-service',
              },
            },
            {
              title: 'Enterprise consulting',
              text: 'Strategic guidance to maximize your AI and digital investments.',
              points: [
                'AI strategy & roadmapping',
                'Digital transformation planning',
                'Data analytics & BI',
                'Process optimization',
                'Change management',
              ],
              link: {
                label: 'Explore digital consulting',
                href: '/services/digital-consulting',
              },
            },
          ],
          columns: 3,
          indexPrefix: 'P',
        }),
      ].join(''),
    ),
    place(
      'company.chapter',
      {
        index: 2,
        id: 'portfolio',
        label: 'Portfolio',
        title: 'The complete service portfolio',
        lede: 'Specialised services across AI, SaaS and enterprise technology.',
      },
      [place('company.link-rows')].join(''),
    ),
    place('company.related-hubs'),
    place('company.cta', {
      family: 'services',
      title: 'Ready to transform your business?',
      text: "Let's discuss how AI and SaaS can accelerate your growth and give you a competitive edge.",
      primary: {
        label: 'Get a quote',
        href: '/get-a-quote',
        external: false,
      },
      secondary: {
        label: 'Contact us',
        href: '/contact',
        external: false,
      },
    }),
  ].join(''),
  css: '',
};
