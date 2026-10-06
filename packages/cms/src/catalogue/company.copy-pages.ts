/**
 * The page-specific company components' words as they were before the CMS: the contact
 * page's body and form, the sitemap and the budget calculator.
 */
import { FORM_CAPTCHA_COPY, FORM_STATUS_COPY } from './forms.copy';

export const COMPANY_CONTACT_PROPS = {
  ...{
    label: '01 — Write to us',
    title: 'Send us a message',
    lede: "Reach out and let's explore how we can help transform your business.",
    points: [
      'Quick response time.',
      "Remote-first with global clients — we're just an email or video call away.",
      'Video consultations.',
    ],
    formLabel: 'Message form',
    channelsTitle: 'Direct channels',
    channels: [
      {
        title: 'HR inquiries',
        description: 'For career and HR-related queries',
        value: 'hr@exyconn.com',
        href: 'mailto:hr@exyconn.com',
      },
      {
        title: 'Service inquiries',
        description: 'For service and project queries',
        value: 'services@exyconn.com',
        href: 'mailto:services@exyconn.com',
      },
      {
        title: 'Legal inquiries',
        description: 'For legal and compliance matters',
        value: 'View legal page',
        href: '/legal',
      },
    ],
    linksTitle: 'Quick links',
    links: [
      {
        label: 'AI services',
        href: '/ai',
      },
      {
        label: 'Careers',
        href: '/career',
      },
      {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
    ],
  },
  form: {
    ...{
      formLabel: 'Contact form',
      success: 'Thank you! Your message has been sent successfully.',
      fields: {
        firstName: {
          label: 'First Name',
          placeholder: 'John',
        },
        lastName: {
          label: 'Last Name',
          placeholder: 'Doe',
        },
        email: {
          label: 'Email Address',
          placeholder: 'john@example.com',
        },
        company: {
          label: 'Company Name',
          placeholder: 'Your company',
        },
        message: {
          label: 'Message',
          placeholder: 'Tell us about your project...',
        },
      },
      subject: {
        label: 'Subject',
        placeholder: 'Select a topic',
      },
      subjects: [
        {
          value: 'general',
          label: 'General Inquiry',
        },
        {
          value: 'project',
          label: 'Project Discussion',
        },
        {
          value: 'partnership',
          label: 'Partnership',
        },
        {
          value: 'support',
          label: 'Support',
        },
        {
          value: 'other',
          label: 'Other',
        },
      ],
      submit: 'Send Message',
      sending: 'Sending...',
      finePrint: {
        text: 'By submitting this form, you agree to our',
        linkLabel: 'Privacy Policy',
        linkHref: '/privacy-policy',
        after: '.',
      },
      messages: {
        firstNameRequired: 'First name is required',
        lastNameRequired: 'Last name is required',
        tooShort: 'Too short!',
        tooLong: 'Too long!',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email address',
        subjectRequired: 'Please select a subject',
        messageRequired: 'Message is required',
        messageTooShort: 'Message is too short!',
        messageTooLong: 'Message is too long!',
        captchaRequired: 'Please solve the captcha',
      },
    },
    captcha: FORM_CAPTCHA_COPY,
    status: FORM_STATUS_COPY,
  },
};

export const COMPANY_SITEMAP_PROPS = {
  crumbs: [
    {
      label: 'Home',
      href: '/',
    },
    {
      label: 'Sitemap',
      href: '',
    },
  ],
  title: 'Every page, one map',
  navLabel: 'Sitemap',
  stats: '{pages} pages in {sections} sections',
  filterLabel: 'Search the sitemap',
  searchLabel: 'Search pages',
  searchPlaceholder: 'Page name',
  countTemplate: '{shown} of {total} pages',
  noMatch: 'No page matches that search.',
  pages: '{count} pages',
  page: '1 page',
};

export const COMPANY_QUOTE_PROPS = {
  text: {
    ...{
      steps: ['Service', 'Scope', 'Contact', 'Review'],
      progress: 'Step {current} of {total}',
      formLabel: 'Project budget calculator',
      back: 'Back',
      next: 'Continue',
      send: 'Send my estimate',
      sending: 'Sending…',
      service: {
        legend: 'Project type',
        describe: 'Describe your project',
        describePlaceholder: 'Tell us about your custom project requirements...',
      },
      scope: {
        team: 'Team composition',
        role: 'Role',
        count: 'Count',
        rate: 'Rate/hr (USD)',
        customName: 'Custom role name',
        removeRole: 'Remove {role}',
        duration: 'Project duration',
        customMonths: 'Custom duration (months)',
        hours: 'Work commitment',
        hoursUnit: 'h/month',
        customNamePlaceholder: 'Enter custom role name...',
        addRole: 'Add team member',
      },
      contact: {
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email address',
        company: 'Company name',
        notes: 'Anything else we should know?',
        optional: '(optional)',
      },
      review: {
        lede: "We'll receive this estimate with your details and reply by email.",
        edit: 'Edit',
      },
      summary: {
        title: 'Estimated budget',
        projectType: 'Project type',
        team: 'Team size',
        duration: 'Duration',
        hours: 'Work hours',
        base: 'Base cost',
        complexity: 'Complexity',
        members: 'members',
        note: 'This is an estimate based on your selections. Final costs may vary based on specific requirements.',
        download: 'Download summary (.txt)',
        hoursSuffix: 'h/month',
      },
      sent: "Thank you — your estimate is with our team. We'll reply by email.",
      contactEmail: 'services@exyconn.com',
    },
    captcha: FORM_CAPTCHA_COPY,
    status: FORM_STATUS_COPY,
  },
  after: {
    label: 'What happens next',
    title: 'After you send your estimate',
    talkText: 'Rather talk it through? Send us a message instead.',
    talkAction: {
      label: 'Contact us',
      href: '/contact',
      external: false,
    },
  },
  nextSteps: [
    {
      title: 'Your estimate reaches our team',
      text: 'The selections, total and your notes arrive together.',
    },
    {
      title: 'We reply by email',
      text: 'To the address you gave, to talk through scope.',
    },
    {
      title: 'We shape it into a plan',
      text: 'Team, timeline and budget refined with you.',
    },
  ],
};
