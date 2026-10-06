import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/exyconn-services (formerly src/pages/[market]/exyconn-services.astro): the
 * infrastructure platform's directory, integration, the other hubs and the closing call.
 */
export const EXYCONN_SERVICES_PAGE: CmsSeedPage = {
  key: 'exyconn-services',
  path: '/exyconn-services',
  kind: 'PAGE',
  title: 'Exyconn Infrastructure Platform | Services',
  layout: 'default',
  seo: {
    title: 'Exyconn Infrastructure Platform | Services',
    description:
      "Explore Exyconn's comprehensive infrastructure platform. Email, SMS, payments, logs, themes, translations, and 25+ services ready to power your application.",
    keywords:
      'infrastructure platform, API services, email service, payment processing, logging, themes, translations, Exyconn',
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
          name: 'Infrastructure platform',
        },
      ],
    },
  },
  html: [
    place('company.platform-hub'),
    place(
      'company.chapter',
      {
        index: 2,
        id: 'integration',
        label: 'Integration',
        title: 'Easy to integrate',
        lede: 'All services are accessible via REST API with comprehensive documentation and SDKs.',
      },
      [
        place('company.info-grid', {
          items: [
            {
              title: 'REST API',
              text: 'Comprehensive REST endpoints for all services.',
              points: [],
              link: {
                label: '',
                href: '',
              },
            },
            {
              title: 'SDKs',
              text: 'JavaScript, Python, and more coming soon.',
              points: [],
              link: {
                label: '',
                href: '',
              },
            },
            {
              title: 'MCP ready',
              text: 'AI agent compatible via Model Context Protocol.',
              points: [],
              link: {
                label: '',
                href: '',
              },
            },
          ],
          columns: 3,
          indexPrefix: 'I',
        }),
      ].join(''),
    ),
    place('company.related-hubs', {
      index: 3,
      label: 'Explore',
      title: 'Services, pillars and AI',
      links: [
        {
          href: '/services',
          title: 'Services hub',
          text: 'Every service by pillar — build, modernise and grow.',
          more: 'Browse services',
        },
        {
          href: '/our-services',
          title: 'Our service pillars',
          text: 'AI platform services, SaaS development and enterprise consulting.',
          more: 'See the pillars',
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
    }),
    place('company.cta', {
      family: 'services',
      title: 'Ready to get started?',
      text: 'Access the complete infrastructure stack and launch your product faster.',
      primary: {
        label: 'Get started',
        href: '/contact',
        external: false,
      },
      secondary: {
        label: 'Explore AI services',
        href: '/ai-services',
        external: false,
      },
    }),
  ].join(''),
  css: '',
};
