import { CAREER_ROLE_LIST_COPY } from './career.copy';

/**
 * The words of the careers detail templates (a gig, a company, a role) as they were before the
 * CMS. The gig, company or role itself comes from Website › Careers.
 */

export const CAREER_GIG_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Careers', href: '/career' },
    { label: 'Gigs', href: '/career/gigs' },
  ],
  facts: { budget: 'Budget', duration: 'Duration', category: 'Category', status: 'Status' },
  sections: {
    description: 'Project description',
    deliverables: 'Deliverables',
    requirements: 'Requirements',
    skills: 'Skills and technologies',
  },
  labels: {
    open: 'Open',
    closed: 'Closed',
    urgent: 'Urgent',
    posted: 'Posted {date}',
    deadline: 'Apply by {date}',
    skills: 'Skills',
  },
  apply: {
    title: 'Ready to apply?',
    text: 'Send your portfolio and a short introduction. We reply within 48 hours.',
    email: 'Apply by email',
    whatsapp: 'Apply on WhatsApp',
    form: 'Apply online',
    subject: 'Application for {title} ({code})',
  },
  closed: {
    title: 'This gig is closed',
    text: 'It is no longer taking applications. Browse the gigs that are open now.',
    action: { label: 'Open gigs', href: '/career/gigs' },
  },
  relatedLabel: 'More like this',
  relatedTitle: 'More open gigs',
  allGigs: { label: 'All gigs', href: '/career/gigs' },
};

export const CAREER_COMPANY_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Careers', href: '/career' },
  ],
  title: 'Careers at {name}',
  roles: 'See {n} open roles',
  role: 'See the open role',
  website: 'Visit website',
  employees: '{n} employees',
  founded: 'Founded {year}',
  about: { label: 'About', title: 'About {name}' },
  culture: { label: 'Culture', title: 'How we work' },
  socialLabel: 'Follow {name}',
  benefits: { label: 'Benefits', title: 'Why join {name}' },
  openings: {
    label: 'Open positions',
    title: 'Find your role at {name}',
    list: CAREER_ROLE_LIST_COPY,
    empty: {
      label: 'No openings right now',
      title: '{name} is not hiring today',
      text: 'New positions open often. Look at roles across the group, or tell us what you are looking for.',
      primary: { label: 'All open roles', href: '/career' },
      secondary: { label: 'Contact us', href: '/contact' },
    },
  },
  noFit: {
    text: "Don't see a role that fits? Tell us what you are looking for.",
    action: { label: 'Contact us', href: '/contact' },
  },
  cta: {
    label: 'Explore more',
    title: 'Opportunities across the group',
    text: '',
    primary: { label: 'All careers', href: '/career' },
    secondary: { label: 'Freelance gigs', href: '/career/gigs' },
  },
};

export const CAREER_JOB_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Careers', href: '/career' },
  ],
  posted: 'Posted {date}',
  deadline: 'Apply by {date}',
  skills: 'Skills required',
  body: {
    about: 'About this role',
    responsibilities: 'Key responsibilities',
    requirements: 'Requirements',
    niceToHave: 'Nice to have',
    benefits: 'Benefits',
  },
  facts: {
    company: 'Company',
    location: 'Location',
    type: 'Type',
    level: 'Level',
    salary: 'Salary',
  },
  apply: 'Apply now',
  applyFor: 'Apply for this role',
  applyTitle: 'Apply for this position',
  applyLede: 'Fill in the form and we will get back to you within 48 hours.',
  share: {
    heading: 'Share this role',
    x: 'Share on X',
    linkedIn: 'Share on LinkedIn',
    copy: 'Copy link',
    copied: 'Link copied',
    copyFailed: 'Copy failed — select the address bar instead',
  },
  shareTitle: '{title} at {name}',
  relatedLabel: 'Also hiring',
  relatedTitle: 'Other roles at {name}',
  companyMore: 'All roles at {name}',
};
