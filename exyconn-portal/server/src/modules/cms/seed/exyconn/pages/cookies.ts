import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/cookies (formerly src/pages/[market]/cookies.astro): the legal document.
 */
export const COOKIES_PAGE: CmsSeedPage = {
  key: 'cookies',
  path: '/cookies',
  kind: 'PAGE',
  title: 'Cookies Policy | How We Use Cookies | Exyconn',
  layout: 'default',
  seo: {
    title: 'Cookies Policy | How We Use Cookies | Exyconn',
    description:
      'Learn how Exyconn uses cookies and similar technologies to enhance your experience, analyze site usage, and provide relevant content.',
    keywords: 'cookies policy, cookie usage, privacy, Exyconn, website cookies, data protection',
    ogImageUrl: '',
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
          name: 'Legal',
          item: '{siteUrl}/legal',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Cookie policy',
        },
      ],
    },
  },
  html: [
    place('legal.document', {
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'Legal',
          href: '/legal',
        },
        {
          label: 'Cookie policy',
          href: '',
        },
      ],
      title: 'Cookie policy',
      family: 'company',
      scene: {
        shapes: ['shield'],
        data: {},
      },
      updated: '',
      updatedLabel: 'Last updated',
      summaryTitle: 'In plain words',
      summary: [
        'Cookies are small text files placed on your device when you visit a website.',
        'We use them to remember your preferences, run essential features, analyse traffic and show relevant content.',
        'We use four types: essential, performance and analytics, functionality and marketing.',
        'You can manage them in your browser settings or in our cookie banner; turning them off may affect how the site works.',
      ],
      tocLabel: 'On this page',
      anchorLabel: 'Link to this section',
      sections: [
        {
          id: 'what-are-cookies',
          label: 'What are cookies?',
          bodyHtml:
            '<p>Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to site owners.</p>',
        },
        {
          id: 'how-we-use-cookies',
          label: 'How we use cookies',
          bodyHtml:
            '<ul class="legal-list"><li>Remember your preferences and settings</li><li>Enable essential website functionality</li><li>Analyze site traffic and usage to improve our services</li><li>Provide relevant content and enhance your experience</li></ul>',
        },
        {
          id: 'types-of-cookies',
          label: 'Types of cookies we use',
          bodyHtml:
            '<dl class="legal-terms"><div class="inner-panel"><dt>Essential Cookies</dt><dd>Necessary for the website to function. Cannot be switched off.</dd></div><div class="inner-panel"><dt>Performance &amp; Analytics</dt><dd>Help us understand how visitors interact with our website.</dd></div><div class="inner-panel"><dt>Functionality Cookies</dt><dd>Remember choices you make and provide enhanced features.</dd></div><div class="inner-panel"><dt>Marketing Cookies</dt><dd>Used to deliver relevant advertisements to you.</dd></div></dl>',
        },
        {
          id: 'managing-cookies',
          label: 'Managing cookies',
          bodyHtml:
            '<p>You can control and manage cookies in various ways:</p><ul class="legal-list"><li><strong>Browser Settings: </strong>Find these in the &quot;options&quot; or &quot;preferences&quot; menu of your browser.</li><li><strong>Cookie Banner: </strong>Use our cookie consent banner when you first visit to manage preferences.</li></ul><p class="legal-note">Note: Disabling cookies may affect the functionality of this website.</p>',
        },
        {
          id: 'questions',
          label: 'Questions?',
          bodyHtml:
            '<p>For more details about how we use and protect your data, see our <a href="/privacy-policy">Privacy Policy</a>. Contact us at <a href="mailto:info@exyconn.com">info@exyconn.com</a> for any questions.</p>',
        },
      ],
      relatedTitle: 'Related policies',
      related: [
        {
          label: 'Privacy policy',
          text: 'How we collect, use, and protect your personal information.',
          href: '/privacy-policy',
        },
        {
          label: 'Company policies',
          text: 'The commitments we publish, and when each one took effect.',
          href: '/policies',
        },
        {
          label: 'Legal requests',
          text: 'Copyright, takedown, trademark and privacy requests.',
          href: '/legal',
        },
        {
          label: 'Raise a grievance',
          text: 'Share a concern with our compliance team, confidentially.',
          href: '/grievance',
        },
        {
          label: 'Contact us',
          text: 'Anything else — reach the team directly.',
          href: '/contact',
        },
      ],
    }),
  ].join(''),
  css: '',
};
