import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/order-agents (formerly src/pages/[market]/order-agents/index.astro): the band
 * and the agent suite builder.
 */
export const ORDER_AGENTS_PAGE: CmsSeedPage = {
  key: 'order-agents',
  path: '/order-agents',
  kind: 'PAGE',
  title: 'Order AI Agents | Exyconn',
  layout: 'default',
  seo: {
    title: 'Order AI Agents | Exyconn',
    description:
      'Order AI agents for your business. Select from a list of automation agents and add them to your order list.',
    keywords: 'order, AI agents, Exyconn, automation, business',
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
          item: '{siteUrl}/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'AI',
          item: '{siteUrl}/ai',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Order agents',
        },
      ],
    },
  },
  html: [
    place('company.stage', {
      family: 'ai',
      variant: 'band',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'AI',
          href: '/ai',
        },
        {
          label: 'Order agents',
          href: '',
        },
      ],
      title: 'Build your AI agent suite',
      lede: 'Select from our professional, production-ready AI agents and create a custom automation toolkit for your business.',
      primary: {
        label: '',
        href: '',
        external: false,
      },
      secondary: {
        label: '',
        href: '',
        external: false,
      },
      scene: {
        shapes: ['rings'],
        data: {
          rings: {
            rings: 5,
          },
        },
      },
      globeFromMarkets: false,
    }),
    place('agents.order'),
  ].join(''),
  css: '',
};
