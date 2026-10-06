import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/our-vision (formerly src/pages/[market]/our-vision.astro): the sunrise stage,
 * the statement, the horizons, the principles, what lies ahead and the closing call.
 */
export const OUR_VISION_PAGE: CmsSeedPage = {
  key: 'our-vision',
  path: '/our-vision',
  kind: 'PAGE',
  title: 'Our Vision | Exyconn',
  layout: 'default',
  seo: {
    title: 'Our Vision | Exyconn',
    description:
      "Discover Exyconn's vision for responsible AI automation. Learn how we empower organizations with ethical, human-centric, and sustainable AI solutions for a smarter, more connected future.",
    keywords:
      'Exyconn vision, responsible AI, ethical automation, human-centric AI, sustainable technology, business innovation',
    ogImageUrl:
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&w=1200&q=80',
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
          item: '{siteUrl}/about-us',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Our vision',
        },
      ],
    },
  },
  html: [
    place('company.stage', {
      family: 'company',
      variant: 'hero',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'About us',
          href: '/about-us',
        },
        {
          label: 'Our vision',
          href: '',
        },
      ],
      title: 'Empowering progress through innovation',
      lede: 'We envision a future where AI empowers every organization to achieve their full potential—driving efficiency, creativity, and growth while respecting human values.',
      primary: {
        label: 'Join our journey',
        href: '/contact',
        external: false,
      },
      secondary: {
        label: 'About us',
        href: '/about-us',
        external: false,
      },
      scene: {
        shapes: ['horizon'],
        data: {
          horizon: {
            horizons: 3,
          },
        },
      },
      globeFromMarkets: false,
    }),
    place(
      'company.chapter',
      {
        index: 1,
        id: 'statement',
        label: 'Building tomorrow, today',
        title: 'AI that serves people and the businesses they run',
        lede: '',
      },
      [
        place('company.statement', {
          paragraphs: [
            "We're constantly exploring new ways to make AI more accessible, secure, and beneficial for everyone.",
            'Our vision is a future where businesses thrive, people are empowered, and technology serves humanity.',
          ],
          points: [],
        }),
      ].join(''),
    ),
    place(
      'company.chapter',
      {
        index: 2,
        id: 'horizons',
        label: "What we're working toward",
        title: 'Three horizons',
        lede: 'Ambitious goals that drive our everyday decisions.',
      },
      [place('company.horizons')].join(''),
    ),
    place(
      'company.chapter',
      {
        index: 3,
        id: 'principles',
        label: 'Vision pillars',
        title: 'The principles that guide our path forward',
        lede: '',
      },
      [
        place('company.beliefs', {
          items: [
            {
              title: 'AI-first innovation',
              text: 'We believe AI should be accessible, ethical, and a force for good—driving efficiency, creativity, and growth while respecting privacy and human values.',
            },
            {
              title: 'Human-centric design',
              text: "We design AI solutions that enhance—not replace—human capabilities. Our tools are intuitive, transparent, and built to support your team's unique workflows.",
            },
            {
              title: 'Sustainable impact',
              text: 'We deliver automation that drives business results while supporting long-term sustainability and positive societal impact.',
            },
            {
              title: 'Trust & transparency',
              text: 'We build trust through transparency, security, and ethical AI practices in everything we create.',
            },
          ],
        }),
      ].join(''),
    ),
    place(
      'company.chapter',
      {
        index: 4,
        id: 'ahead',
        label: 'Looking ahead',
        title: 'Responsible innovation, every step',
        lede: '',
      },
      [place('company.statement')].join(''),
    ),
    place('company.cta', {
      family: 'company',
      title: 'Ready to shape the future together?',
      text: 'Connect with our team to discover how Exyconn can help your business lead with AI innovation.',
      primary: {
        label: 'Contact us',
        href: '/contact',
        external: false,
      },
      secondary: {
        label: 'Join our team',
        href: '/career',
        external: false,
      },
    }),
  ].join(''),
  css: '',
};
