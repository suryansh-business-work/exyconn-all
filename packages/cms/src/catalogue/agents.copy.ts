/** /order-agents as it was before the CMS: the five agents on offer and the form's words. */
import { FORM_CAPTCHA_COPY, FORM_STATUS_COPY } from './forms.copy';

export const AGENTS_ORDER_PROPS = {
  agents: [
    {
      id: 'sales-automation',
      name: 'Sales Automation Agent',
      description: 'Automate your sales pipeline and follow-ups with advanced AI workflows.',
    },
    {
      id: 'customer-support',
      name: 'Customer Support Agent',
      description: 'Deliver 24/7 AI-powered customer support with seamless handoff to humans.',
    },
    {
      id: 'data-entry',
      name: 'Data Entry Agent',
      description: 'Eliminate repetitive data entry with intelligent extraction and validation.',
    },
    {
      id: 'marketing-automation',
      name: 'Marketing Automation Agent',
      description: 'Boost campaigns and lead generation with adaptive AI strategies.',
    },
    {
      id: 'hr-onboarding',
      name: 'HR Onboarding Agent',
      description: 'Accelerate onboarding and HR tasks with smooth, automated AI processes.',
    },
  ],
  text: {
    available: 'Available AI agents',
    suite: 'Your AI suite',
    add: 'Add to suite',
    added: 'Added',
    remove: 'Remove',
    empty: 'No agents added yet.',
    count: '{count} of {total} selected',
    detailsTitle: 'Your details',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email address',
    company: 'Company name',
    notes: 'Anything else we should know?',
    submit: 'Submit suite request',
    sending: 'Sending…',
    sent: "Thank you — your suite request is with our team. We'll reply by email.",
    optional: '(optional)',
    captcha: FORM_CAPTCHA_COPY,
    status: FORM_STATUS_COPY,
    messages: {
      pickOne: 'Please add at least one agent to your suite.',
      firstNameRequired: 'First name is required',
      lastNameRequired: 'Last name is required',
      tooShort: 'Too short!',
      tooLong: 'Too long!',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email address',
      captchaRequired: 'Please solve the captcha',
    },
  },
};
