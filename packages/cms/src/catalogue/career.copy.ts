/**
 * The careers pages' words as they were before the CMS (exyconn-website/src/lib/career/copy.ts).
 * Roles, companies and gigs stay in Website › Careers. `{n}`, `{name}`, `{date}` and the like are
 * filled in by the website with the live values.
 */

const CAREERS_INBOX = 'careers@exyconn.com';

/** The labels of the open-roles chapter (careers index and every company's page). */
export const CAREER_ROLE_LIST_COPY = {
  filterLabel: 'Filter roles',
  sheetLabel: 'Filters',
  departmentLabel: 'Team',
  allDepartments: 'All teams',
  modeLabel: 'Work mode',
  allModes: 'Any mode',
  companyLabel: 'Company',
  allCompanies: 'All companies',
  searchLabel: 'Search roles',
  searchPlaceholder: 'Title, skill or location',
  countTemplate: '{shown} of {total} roles',
  rolesCount: '{n} open',
  noMatch: 'No role matches those filters.',
};

export const CAREER_INDEX_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Careers', href: '' },
  ],
  title: 'Build, create and grow with us',
  lede: 'Join our ecosystem of companies. Full-time roles, group positions or freelance gigs — find the opportunity that fits.',
  primary: { label: 'See open roles', href: '#open-roles' },
  secondary: { label: 'Freelance gigs', href: '/career/gigs' },
  proofLabel: 'Open now',
  stats: { roles: 'Open roles', companies: 'Companies hiring', gigs: 'Freelance gigs' },
  roles: {
    label: 'Open roles',
    title: 'Find your next role',
    lede: 'Every open position across the portfolio, grouped by team.',
    list: CAREER_ROLE_LIST_COPY,
    empty: {
      label: 'No open roles right now',
      title: 'We are not hiring for a full-time role today',
      text: 'New positions open often. Send us your CV and we will reach out when there is a match, or pick up a freelance gig meanwhile.',
      primary: {
        label: `Email ${CAREERS_INBOX}`,
        href: `mailto:${CAREERS_INBOX}?subject=Open%20application`,
      },
      secondary: { label: 'Freelance gigs', href: '/career/gigs' },
    },
  },
  companies: {
    label: 'Our ecosystem',
    title: 'Explore by company',
    lede: 'Each brand has its own culture, products and openings.',
    roles: '{n} open roles',
    role: '1 open role',
    noRoles: 'No openings right now',
    groupTitle: 'Group roles',
    groupText: 'Work across every company in the group. One role, unlimited variety.',
    viewOpenings: 'View openings',
  },
  gigs: {
    label: 'Freelance',
    title: 'Short-term gigs and projects',
    lede: 'Contract work for skilled freelancers. Quick projects, fair pay, flexible timing.',
    all: 'See all {n} gigs',
    one: 'See the open gig',
    href: '/career/gigs',
    empty: 'No freelance gigs are open right now. New projects are posted here first.',
    skillsLabel: 'Skills',
    urgent: 'Urgent',
  },
  why: {
    label: 'Why join us',
    title: 'Built for growth',
    lede: 'Not just a job — a chance to build something meaningful across multiple industries.',
    perks: [
      {
        title: 'Remote-first culture',
        text: 'Work from anywhere. Flexible hours. A trust-based environment.',
      },
      {
        title: 'Startup speed, stability',
        text: 'Move fast with the backing of an established ecosystem.',
      },
      {
        title: 'Learning and growth',
        text: 'Annual learning budget, mentorship and cross-company exposure.',
      },
      {
        title: 'Health and wellness',
        text: 'Comprehensive insurance, mental health support and wellness programmes.',
      },
    ],
  },
  hiring: {
    label: 'How hiring works',
    title: 'From application to offer',
    steps: [
      {
        when: '',
        title: 'Apply',
        text: "Send the short form on the role's page, with your résumé.",
      },
      {
        when: 'Within 48 hours',
        title: 'Screening',
        text: 'We read every application and reply within 48 hours.',
      },
      { when: '', title: 'Interview', text: 'Meet the team you would work with.' },
      { when: '', title: 'Offer', text: 'The details in writing, then your start date.' },
    ],
  },
  faq: {
    label: 'Questions',
    title: 'Before you apply',
    items: [
      {
        question: 'How soon will I hear back?',
        answer: 'We review every application and get back to you within 48 hours.',
      },
      {
        question: 'Can I work remotely?',
        answer:
          'Most roles are remote-first with flexible hours. Each posting shows its work mode — remote, hybrid or on-site.',
      },
      {
        question: 'What should my résumé look like?',
        answer: 'Any format you like, as a PDF, DOC or DOCX file of up to 5 MB.',
      },
      {
        question: 'What if no open role fits me?',
        answer: `Send your CV to ${CAREERS_INBOX}. We keep it on file and reach out when there is a match.`,
      },
      {
        question: 'How are freelance gigs paid?',
        answer: 'Payment is made within 7 days of the project being completed.',
      },
    ],
    accommodations: `Need an adjustment to apply or interview — a different format, more time or anything else? Email ${CAREERS_INBOX} and we will arrange it.`,
  },
  cta: {
    label: "Don't see your role?",
    title: 'Send us your CV anyway',
    text: 'We are always looking for exceptional people. Drop us your résumé and we will reach out when there is a match.',
    primary: {
      label: `Email ${CAREERS_INBOX}`,
      href: `mailto:${CAREERS_INBOX}?subject=Open%20application`,
    },
    linkedIn: 'Follow on LinkedIn',
  },
};

const FREELANCE_MAIL = {
  label: `Email ${CAREERS_INBOX}`,
  href: `mailto:${CAREERS_INBOX}?subject=Freelance%20inquiry`,
};

export const CAREER_GIGS_PROPS = {
  crumbs: [
    { label: 'Home', href: '/' },
    { label: 'Careers', href: '/career' },
    { label: 'Freelance gigs', href: '' },
  ],
  title: 'Short-term gigs and freelance projects',
  lede: 'Work with our portfolio companies on freelance projects — design to development, content to marketing — on your schedule.',
  primary: { label: 'Browse gigs', href: '#open-gigs' },
  secondary: { label: 'Full-time roles', href: '/career' },
  proofLabel: 'Open now',
  stats: { open: 'Open gigs', urgent: 'Need someone now', categories: 'Categories' },
  listLabel: 'Open gigs',
  listTitle: 'Find a project that fits',
  filters: {
    label: 'Filter gigs',
    sheetLabel: 'Categories',
    categoryLabel: 'Category',
    allCategories: 'All categories',
    searchLabel: 'Search gigs',
    searchPlaceholder: 'Title, skill or category',
    sortLabel: 'Sort',
    sortCategory: 'By category',
    sortNewest: 'Newest',
    sortDeadline: 'Deadline soonest',
    countTemplate: '{shown} of {total} gigs',
  },
  noMatch: 'No gig matches those filters.',
  labels: { skills: 'Skills', urgent: 'Urgent', deadline: 'Apply by {date}' },
  empty: {
    label: 'No open gigs right now',
    title: 'The next projects are being scoped',
    text: 'New gigs are posted here first. Send us your portfolio and we will keep you in mind, or look at our full-time roles.',
    primary: FREELANCE_MAIL,
    secondary: { label: 'Full-time roles', href: '/career' },
  },
  why: {
    label: 'Why work with us',
    title: 'Freelancing, done properly',
    perks: [
      { title: 'Fast payments', text: 'Get paid within 7 days of project completion.' },
      { title: 'Clear requirements', text: 'Detailed briefs, assets and communication.' },
      { title: 'Long-term work', text: 'Great work leads to ongoing collaborations.' },
      { title: 'Portfolio building', text: 'Work on real SaaS products used by thousands.' },
    ],
  },
  cta: {
    label: "Don't see your gig?",
    title: 'Send us your portfolio',
    text: 'We are always looking for talented freelancers. Share your work and areas of expertise — we will keep you in mind for future projects.',
    primary: FREELANCE_MAIL,
    secondary: { label: 'Full-time roles', href: '/career' },
  },
};
