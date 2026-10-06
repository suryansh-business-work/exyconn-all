import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/legal (formerly src/pages/[market]/legal.astro): the legal document,
 * with the sections it renders itself (questions, a form).
 */
export const LEGAL_PAGE: CmsSeedPage = {
  key: 'legal',
  path: '/legal',
  kind: 'PAGE',
  title: 'Legal | Exyconn',
  layout: 'default',
  seo: {
    title: 'Legal | Exyconn',
    description:
      'Submit legal requests regarding copyright, content removal, or intellectual property on Exyconn.',
    keywords: 'legal, copyright, takedown, intellectual property, privacy, trademark, Exyconn',
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
            href: '',
          },
        ],
        title: 'Legal and copyright requests',
        family: 'company',
        scene: {
          shapes: ['shield'],
          data: {},
        },
        updated: '2026-10-03',
        updatedLabel: 'Last updated',
        summaryTitle: 'In plain words',
        summary: [
          'Report copyright infringement, image or content takedowns, trademark or privacy concerns, and other legal issues.',
          'Tell us the URLs involved, your rights to the content and how to reach you.',
          'Submissions are handled confidentially by our compliance and legal teams.',
          'Most requests are reviewed within 5 business days.',
        ],
        tocLabel: 'On this page',
        anchorLabel: 'Link to this section',
        sections: [
          {
            id: 'what-you-can-report',
            label: 'What you can report',
            bodyHtml:
              '<p>Exyconn respects intellectual property rights and is committed to compliance with all applicable laws. Submit your legal concerns below.</p><div class="legal-topics"><article class="inner-card"><h3 class="inner-h3">Copyright infringement</h3><p class="inner-card__text">If you believe your copyrighted material has been used on our website without permission, you can submit a takedown request. Please provide details and evidence of ownership to help us process your claim efficiently.</p><ul class="legal-list legal-list--check"><li>Images, text, or media used without authorization</li><li>Proof of ownership or rights required</li><li>Swift review and removal if validated</li></ul></article><article class="inner-card"><h3 class="inner-h3">Image or content takedown</h3><p class="inner-card__text">To request removal of images or content you own or have rights to, submit a detailed request. We respect all valid takedown notices and act promptly to resolve such issues.</p><ul class="legal-list legal-list--check"><li>Specify the URL(s) of the content in question</li><li>Describe your rights to the content</li><li>We will investigate and respond quickly</li></ul></article><article class="inner-card"><h3 class="inner-h3">Trademark and privacy</h3><p class="inner-card__text">If you have concerns about trademark misuse or privacy/data issues on our site, please let us know. We are committed to protecting intellectual property and personal data.</p><ul class="legal-list legal-list--check"><li>Trademark violations or impersonation</li><li>Personal data or privacy complaints</li><li>Handled confidentially by our compliance team</li></ul></article><article class="inner-card"><h3 class="inner-h3">Other legal issues</h3><p class="inner-card__text">For any other legal concerns not listed above, please describe your issue in detail. Our legal and compliance team will review and respond as appropriate.</p><ul class="legal-list legal-list--check"><li>General legal inquiries</li><li>Policy clarification or compliance requests</li><li>We strive for transparency and fairness</li></ul></article></div>',
          },
          {
            id: 'how-requests-are-handled',
            label: 'How requests are handled',
            bodyHtml: '',
          },
          {
            id: 'submit-a-request',
            label: 'Submit a request',
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
      },
      [
        place('legal.section', undefined, [place('legal.faq')].join('')),
        place(
          'legal.section',
          {
            id: 'submit-a-request',
            number: 3,
            title: 'Submit a request',
            anchorLabel: 'Link to this section',
          },
          [place('forms.legal')].join(''),
        ),
      ].join(''),
    ),
  ].join(''),
  css: '',
};
