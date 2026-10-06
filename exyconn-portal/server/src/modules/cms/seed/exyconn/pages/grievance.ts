import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/grievance (formerly src/pages/[market]/grievance.astro): the legal document,
 * with the sections it renders itself (questions, a form).
 */
export const GRIEVANCE_PAGE: CmsSeedPage = {
  key: 'grievance',
  path: '/grievance',
  kind: 'PAGE',
  title: 'Raise a Grievance | Report Concerns | Exyconn',
  layout: 'default',
  seo: {
    title: 'Raise a Grievance | Report Concerns | Exyconn',
    description:
      'Submit your grievance or concern to Exyconn. We are committed to transparency, fairness, and prompt resolution for all stakeholders.',
    keywords: 'grievance, complaint, concern, compliance, Exyconn',
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
          name: 'Raise a grievance',
        },
      ],
    },
  },
  html: [
    place(
      'legal.document',
      {
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
            label: 'Raise a grievance',
            href: '',
          },
        ],
        title: 'Raise a grievance',
        family: 'contact',
        scene: {
          shapes: ['rings'],
          data: {},
        },
        updated: '',
        updatedLabel: 'Last updated',
        summaryTitle: 'In plain words',
        summary: [
          'Share any concern or grievance with us; our compliance team reviews every submission.',
          'Your identity is protected throughout the process.',
          'Every concern is reviewed impartially.',
          'We aim to respond within 5 business days.',
        ],
        tocLabel: 'On this page',
        anchorLabel: 'Link to this section',
        sections: [
          {
            id: 'our-commitment',
            label: 'Our commitment',
            bodyHtml:
              '<p>At Exyconn, we uphold the highest standards of integrity, transparency, and accountability. If you have a concern or grievance, we encourage you to share it with us.</p><p>All submissions are handled confidentially and reviewed by our compliance team. We strive for prompt and just resolution.</p><dl class="legal-terms"><div class="inner-panel"><dt>Confidential</dt><dd>Your identity is protected throughout the process</dd></div><div class="inner-panel"><dt>Fair Review</dt><dd>Every concern is reviewed impartially by our team</dd></div><div class="inner-panel"><dt>Prompt Response</dt><dd>We aim to respond within 5 business days</dd></div></dl>',
          },
          {
            id: 'submit-your-grievance',
            label: 'Submit your grievance',
            bodyHtml: '',
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
            label: 'Cookie policy',
            text: 'Understanding how we use cookies to improve your experience.',
            href: '/cookies',
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
            label: 'Contact us',
            text: 'Anything else — reach the team directly.',
            href: '/contact',
          },
        ],
      },
      [
        place(
          'legal.section',
          {
            id: 'submit-your-grievance',
            number: 2,
            title: 'Submit your grievance',
            anchorLabel: 'Link to this section',
          },
          [place('forms.grievance')].join(''),
        ),
      ].join(''),
    ),
  ].join(''),
  css: '',
};
