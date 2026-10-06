/**
 * The legal components' defaults: the privacy policy as published before the CMS (wording
 * unchanged), a numbered section and the legal-request page's questions.
 */

export const LEGAL_DOCUMENT_PROPS = {
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
      label: 'Privacy policy',
      href: '',
    },
  ],
  title: 'Privacy policy',
  family: 'company',
  scene: {
    shapes: ['shield'],
    data: {},
  },
  updated: '2025-06-27',
  updatedLabel: 'Last updated',
  summaryTitle: 'In plain words',
  summary: [
    'We collect the contact details you give us, usage data such as your IP address and browser, and cookies.',
    'We use it to run and improve our website and services, to answer you, and to meet legal obligations.',
    'We do not sell your personal information.',
    'You can access, correct or delete your information, and opt out of marketing.',
  ],
  tocLabel: 'On this page',
  anchorLabel: 'Link to this section',
  sections: [
    {
      id: 'introduction',
      label: 'Introduction',
      bodyHtml:
        '<p>Exyconn (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI automation services.</p>',
    },
    {
      id: 'information-we-collect',
      label: 'Information we collect',
      bodyHtml:
        '<ul class="legal-list"><li><strong>Personal Information: </strong>Name, email address, phone number, company name, and other contact details you provide.</li><li><strong>Usage Data: </strong>IP address, browser type, device information, and pages visited.</li><li><strong>Cookies &amp; Tracking: </strong>We use cookies and similar technologies to enhance your experience.</li></ul>',
    },
    {
      id: 'how-we-use-information',
      label: 'How we use your information',
      bodyHtml:
        '<ul class="legal-list"><li>To provide, operate, and maintain our website and services</li><li>To communicate with you and respond to inquiries</li><li>To improve our products, services, and user experience</li><li>To comply with legal obligations and protect our rights</li></ul>',
    },
    {
      id: 'sharing-information',
      label: 'Sharing your information',
      bodyHtml:
        '<ul class="legal-list"><li>We do not sell your personal information</li><li>We may share with trusted service providers under confidentiality agreements</li><li>We may disclose information if required by law</li></ul>',
    },
    {
      id: 'data-security',
      label: 'Data security',
      bodyHtml:
        '<p>We implement reasonable technical and organizational measures to protect your information from unauthorized access, disclosure, alteration, or destruction.</p>',
    },
    {
      id: 'your-rights',
      label: 'Your rights',
      bodyHtml:
        '<p>You have the right to:</p><ul class="legal-list"><li>Access your personal information</li><li>Correct inaccurate data</li><li>Delete your personal information</li><li>Opt out of marketing communications</li></ul>',
    },
    {
      id: 'contact-us',
      label: 'Contact us',
      bodyHtml:
        '<p>If you have any questions about this Privacy Policy or our data practices, please contact us at <a href="mailto:info@exyconn.com">info@exyconn.com</a>.</p>',
    },
  ],
  relatedTitle: 'Related policies',
  related: [
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
};

export const LEGAL_SECTION_PROPS = {
  id: 'how-requests-are-handled',
  number: 2,
  title: 'How requests are handled',
  anchorLabel: 'Link to this section',
};

export const LEGAL_FAQ_PROPS = {
  items: [
    {
      question: 'How long does it take to process a legal or copyright request?',
      answer:
        'Most requests are reviewed within 5 business days. Complex cases or those requiring additional information may take longer. We will notify you by email once your request has been processed or if we need more details.',
    },
    {
      question: 'What information do I need to provide for a takedown or copyright claim?',
      answer:
        'Please provide a clear description of the content in question, the URL(s) where it appears, proof of ownership or rights, and your contact details. The more information you provide, the faster we can process your request.',
    },
    {
      question: 'Will my grievance or legal request be kept confidential?',
      answer:
        'Yes, all submissions are handled confidentially and only shared with our compliance and legal teams as necessary to resolve your issue.',
    },
    {
      question: 'What happens after I submit a legal request?',
      answer:
        'Our compliance team will review your submission, verify the details, and take appropriate action. You may be contacted for additional information if needed. We strive to resolve all valid requests promptly and fairly.',
    },
    {
      question: 'Can I follow up on my request?',
      answer:
        'Yes, if you have not received a response within 5 business days, you may follow up by replying to our confirmation email or contacting us through our official channels.',
    },
  ],
};
