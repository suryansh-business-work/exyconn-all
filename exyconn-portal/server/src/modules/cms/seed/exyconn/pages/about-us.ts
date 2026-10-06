import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/about-us (formerly exyconn-website/src/pages/[market]/about-us.astro): the
 * globe stage, the figures, five chapters and the closing call.
 */
export const ABOUT_US_PAGE: CmsSeedPage = {
  key: 'about-us',
  path: '/about-us',
  kind: 'PAGE',
  title: 'About Us | Our Story & Mission | Exyconn',
  layout: 'default',
  seo: {
    title: 'About Us | Our Story & Mission | Exyconn',
    description:
      "Learn about Exyconn's mission, vision, and values. Meet our team of AI, automation, and digital transformation experts dedicated to helping your business thrive.",
    keywords:
      'about Exyconn, our team, AI experts, automation, digital transformation, company values, mission, vision',
    ogImageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
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
          name: 'About us',
        },
      ],
    },
  },
  html: [
    place('company.stage'),
    place('company.stats'),
    place('company.chapter', undefined, [place('company.info-grid')].join('')),
    place(
      'company.chapter',
      {
        index: 2,
        id: 'work',
        label: 'What we do',
        title: 'Five ways we help',
        lede: 'We deliver comprehensive solutions across AI, automation, and digital transformation.',
      },
      [place('company.link-cards')].join(''),
    ),
    place(
      'company.chapter',
      {
        index: 3,
        id: 'values',
        label: 'What we believe',
        title: 'The principles that guide everything we do',
        lede: '',
      },
      [place('company.beliefs')].join(''),
    ),
    place(
      'company.chapter',
      {
        index: 4,
        id: 'reach',
        label: 'Where we work',
        title: 'Remote-first, published worldwide',
        lede: '',
      },
      [place('company.market-reach')].join(''),
    ),
    place(
      'company.chapter',
      {
        index: 5,
        id: 'next',
        label: 'Keep exploring',
        title: 'More about Exyconn',
        lede: '',
      },
      [
        place('company.link-cards', {
          layout: 'grid',
          indexPrefix: '',
          more: '',
          items: [
            {
              title: 'Our vision',
              text: 'Where we are heading, and the principles that set the course.',
              href: '/our-vision',
            },
            {
              title: 'Careers',
              text: 'Open roles and gigs on a remote-first team.',
              href: '/career',
            },
            {
              title: 'Case studies',
              text: 'What we have built with our clients.',
              href: '/case-studies',
            },
          ],
        }),
      ].join(''),
    ),
    place('company.cta'),
  ].join(''),
  css: '',
};
