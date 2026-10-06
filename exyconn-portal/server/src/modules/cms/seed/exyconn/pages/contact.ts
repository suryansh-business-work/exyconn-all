import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/contact (formerly src/pages/[market]/contact.astro): the band and the contact
 * panel (form, channels, quick links).
 */
export const CONTACT_PAGE: CmsSeedPage = {
  key: 'contact',
  path: '/contact',
  kind: 'PAGE',
  title: 'Contact Us | Get in Touch with Exyconn',
  layout: 'default',
  seo: {
    title: 'Contact Us | Get in Touch with Exyconn',
    description:
      'Contact Exyconn for AI automation, SaaS solutions, and business inquiries. Reach out to our team for support, partnership, or to start your digital transformation journey.',
    keywords: 'contact, Exyconn, AI automation, SaaS, business inquiry, support, partnership',
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
          name: 'Contact',
        },
      ],
    },
  },
  html: [
    place('company.stage', {
      family: 'contact',
      variant: 'band',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'Contact',
          href: '',
        },
      ],
      title: "Let's start a conversation",
      lede: "Have a project in mind? Questions about our services? We'd love to hear from you.",
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
        data: {},
      },
      globeFromMarkets: false,
    }),
    place('company.contact'),
  ].join(''),
  css: '',
};
