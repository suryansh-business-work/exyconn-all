/**
 * Words on the careers pages (index, gigs, gig, company, job). Roles, gigs and companies
 * come from the portal; this holds only the page copy, all of it carried over from what the
 * pages already said. `{n}`-style placeholders are filled by `fill` in ./format.
 */
import type { InnerAction } from "../../components/inner/types";

/** Where every "don't see a role" path ends: the careers inbox the site has always shown. */
export const CAREERS_EMAIL = "careers@exyconn.com";

const careersMail = (subject: string): InnerAction => ({
  label: `Email ${CAREERS_EMAIL}`,
  href: `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(subject)}`,
});

export const CAREERS_COPY = {
  metaTitle: "Careers & Freelance Gigs | Exyconn",
  metaDescription:
    "Explore career opportunities across Exyconn, Spentiva, Sibera, and Duncit. Full-time roles and freelance gigs in AI, FinTech, community apps, and more.",
  metaKeywords: "careers, jobs, freelance, gigs, AI jobs, SaaS jobs, remote jobs, Exyconn careers",
  metaImage: "/career/og-image.png",
  crumb: "Careers",
  title: "Build, create and grow with us",
  lede: "Join our ecosystem of companies. Full-time roles, group positions or freelance gigs — find the opportunity that fits.",
  primary: { label: "See open roles", href: "#open-roles" },
  secondary: { label: "Freelance gigs", href: "/career/gigs" },
  proofLabel: "Open now",
  statRoles: "Open roles",
  statCompanies: "Companies hiring",
  statGigs: "Freelance gigs",
  rolesLabel: "Open roles",
  rolesTitle: "Find your next role",
  rolesLede: "Every open position across the portfolio, grouped by team.",
  filterLabel: "Filter roles",
  sheetLabel: "Filters",
  departmentLabel: "Team",
  allDepartments: "All teams",
  modeLabel: "Work mode",
  allModes: "Any mode",
  companyLabel: "Company",
  allCompanies: "All companies",
  searchLabel: "Search roles",
  searchPlaceholder: "Title, skill or location",
  countTemplate: "{shown} of {total} roles",
  noMatch: "No role matches those filters.",
  rolesCount: "{n} open",
  emptyRolesLabel: "No open roles right now",
  emptyRolesTitle: "We are not hiring for a full-time role today",
  emptyRolesText:
    "New positions open often. Send us your CV and we will reach out when there is a match, or pick up a freelance gig meanwhile.",
  companiesLabel: "Our ecosystem",
  companiesTitle: "Explore by company",
  companiesLede: "Each brand has its own culture, products and openings.",
  companyRoles: "{n} open roles",
  companyRole: "1 open role",
  companyNoRoles: "No openings right now",
  groupTitle: "Group roles",
  groupText: "Work across every company in the group. One role, unlimited variety.",
  viewOpenings: "View openings",
  gigsLabel: "Freelance",
  gigsTitle: "Short-term gigs and projects",
  gigsLede: "Contract work for skilled freelancers. Quick projects, fair pay, flexible timing.",
  allGigs: "See all {n} gigs",
  allGig: "See the open gig",
  emptyGigsText: "No freelance gigs are open right now. New projects are posted here first.",
  whyLabel: "Why join us",
  whyTitle: "Built for growth",
  whyLede: "Not just a job — a chance to build something meaningful across multiple industries.",
  hiringLabel: "How hiring works",
  hiringTitle: "From application to offer",
  faqLabel: "Questions",
  faqTitle: "Before you apply",
  accommodations:
    "Need an adjustment to apply or interview — a different format, more time or anything else? Email {email} and we will arrange it.",
  ctaLabel: "Don't see your role?",
  ctaTitle: "Send us your CV anyway",
  ctaText:
    "We are always looking for exceptional people. Drop us your résumé and we will reach out when there is a match.",
  ctaPrimary: careersMail("Open application"),
  linkedIn: "Follow on LinkedIn",
} as const;

/** The four perks the careers page has always listed. */
export const CAREER_PERKS = [
  {
    title: "Remote-first culture",
    text: "Work from anywhere. Flexible hours. A trust-based environment.",
  },
  {
    title: "Startup speed, stability",
    text: "Move fast with the backing of an established ecosystem.",
  },
  {
    title: "Learning and growth",
    text: "Annual learning budget, mentorship and cross-company exposure.",
  },
  {
    title: "Health and wellness",
    text: "Comprehensive insurance, mental health support and wellness programmes.",
  },
] as const;

/** The portal's hiring pipeline (New → Screening → Interview → Offer), as an applicant sees it. */
export const HIRING_STEPS = [
  { title: "Apply", text: "Send the short form on the role's page, with your résumé." },
  {
    when: "Within 48 hours",
    title: "Screening",
    text: "We read every application and reply within 48 hours.",
  },
  { title: "Interview", text: "Meet the team you would work with." },
  { title: "Offer", text: "The details in writing, then your start date." },
] as const;

export const CAREERS_FAQ = [
  {
    question: "How soon will I hear back?",
    answer: "We review every application and get back to you within 48 hours.",
  },
  {
    question: "Can I work remotely?",
    answer:
      "Most roles are remote-first with flexible hours. Each posting shows its work mode — remote, hybrid or on-site.",
  },
  {
    question: "What should my résumé look like?",
    answer: "Any format you like, as a PDF, DOC or DOCX file of up to 5 MB.",
  },
  {
    question: "What if no open role fits me?",
    answer: `Send your CV to ${CAREERS_EMAIL}. We keep it on file and reach out when there is a match.`,
  },
  {
    question: "How are freelance gigs paid?",
    answer: "Payment is made within 7 days of the project being completed.",
  },
] as const;

export const GIGS_COPY = {
  metaTitle: "Freelance Gigs & Short Projects | Exyconn",
  metaDescription:
    "Find freelance opportunities and short-term contract projects across Development, Design, Writing, Video, Data, and Marketing with Exyconn's portfolio companies.",
  crumbHome: "Home",
  crumbCareers: "Careers",
  crumb: "Freelance gigs",
  title: "Short-term gigs and freelance projects",
  lede: "Work with our portfolio companies on freelance projects — design to development, content to marketing — on your schedule.",
  primary: { label: "Browse gigs", href: "#open-gigs" },
  secondary: { label: "Full-time roles", href: "/career" },
  proofLabel: "Open now",
  statOpen: "Open gigs",
  statUrgent: "Need someone now",
  statCategories: "Categories",
  listLabel: "Open gigs",
  listTitle: "Find a project that fits",
  filterLabel: "Filter gigs",
  sheetLabel: "Categories",
  categoryLabel: "Category",
  allCategories: "All categories",
  searchLabel: "Search gigs",
  searchPlaceholder: "Title, skill or category",
  sortLabel: "Sort",
  sortCategory: "By category",
  sortNewest: "Newest",
  sortDeadline: "Deadline soonest",
  countTemplate: "{shown} of {total} gigs",
  noMatch: "No gig matches those filters.",
  emptyLabel: "No open gigs right now",
  emptyTitle: "The next projects are being scoped",
  emptyText:
    "New gigs are posted here first. Send us your portfolio and we will keep you in mind, or look at our full-time roles.",
  whyLabel: "Why work with us",
  whyTitle: "Freelancing, done properly",
  ctaLabel: "Don't see your gig?",
  ctaTitle: "Send us your portfolio",
  ctaText:
    "We are always looking for talented freelancers. Share your work and areas of expertise — we will keep you in mind for future projects.",
  ctaPrimary: careersMail("Freelance inquiry"),
  ctaSecondary: { label: "Full-time roles", href: "/career" },
} as const;

/** The freelance promises the gigs pages have always made. */
export const GIG_PERKS = [
  { title: "Fast payments", text: "Get paid within 7 days of project completion." },
  { title: "Clear requirements", text: "Detailed briefs, assets and communication." },
  { title: "Long-term work", text: "Great work leads to ongoing collaborations." },
  { title: "Portfolio building", text: "Work on real SaaS products used by thousands." },
] as const;

/** Labels shared by the gig card and the gig page. */
export const GIG_LABELS = {
  urgent: "Urgent",
  posted: "Posted {date}",
  deadline: "Apply by {date}",
  open: "Open",
  closed: "Closed",
  skills: "Skills",
} as const;

export const GIG_COPY = {
  crumbHome: "Home",
  crumbCareers: "Careers",
  crumbGigs: "Gigs",
  budget: "Budget",
  duration: "Duration",
  category: "Category",
  status: "Status",
  description: "Project description",
  deliverables: "Deliverables",
  requirements: "Requirements",
  skills: "Skills and technologies",
  applyTitle: "Ready to apply?",
  applyText: "Send your portfolio and a short introduction. We reply within 48 hours.",
  applyEmail: "Apply by email",
  applyWhatsApp: "Apply on WhatsApp",
  applyForm: "Apply online",
  applySubject: "Application for {title} ({code})",
  closedTitle: "This gig is closed",
  closedText: "It is no longer taking applications. Browse the gigs that are open now.",
  closedAction: { label: "Open gigs", href: "/career/gigs" },
  relatedLabel: "More like this",
  relatedTitle: "More open gigs",
  allGigs: { label: "All gigs", href: "/career/gigs" },
} as const;

export const COMPANY_COPY = {
  crumbHome: "Home",
  crumbCareers: "Careers",
  title: "Careers at {name}",
  roles: "See {n} open roles",
  role: "See the open role",
  website: "Visit website",
  employees: "{n} employees",
  founded: "Founded {year}",
  aboutLabel: "About",
  aboutTitle: "About {name}",
  cultureLabel: "Culture",
  cultureTitle: "How we work",
  benefitsLabel: "Benefits",
  benefitsTitle: "Why join {name}",
  rolesLabel: "Open positions",
  rolesTitle: "Find your role at {name}",
  emptyRolesLabel: "No openings right now",
  emptyRolesTitle: "{name} is not hiring today",
  emptyRolesText:
    "New positions open often. Look at roles across the group, or tell us what you are looking for.",
  emptyPrimary: { label: "All open roles", href: "/career" },
  emptySecondary: { label: "Contact us", href: "/contact" },
  noFitText: "Don't see a role that fits? Tell us what you are looking for.",
  noFitAction: { label: "Contact us", href: "/contact" },
  socialLabel: "Follow {name}",
  ctaLabel: "Explore more",
  ctaTitle: "Opportunities across the group",
  ctaPrimary: { label: "All careers", href: "/career" },
  ctaSecondary: { label: "Freelance gigs", href: "/career/gigs" },
} as const;

export const JOB_COPY = {
  crumbHome: "Home",
  crumbCareers: "Careers",
  posted: "Posted {date}",
  deadline: "Apply by {date}",
  apply: "Apply now",
  applyFor: "Apply for this role",
  applyTitle: "Apply for this position",
  applyLede: "Fill in the form and we will get back to you within 48 hours.",
  skills: "Skills required",
  about: "About this role",
  responsibilities: "Key responsibilities",
  requirements: "Requirements",
  niceToHave: "Nice to have",
  benefits: "Benefits",
  companyLabel: "Company",
  factLocation: "Location",
  factType: "Type",
  factLevel: "Level",
  factSalary: "Salary",
  companyMore: "All roles at {name}",
  relatedLabel: "Also hiring",
  relatedTitle: "Other roles at {name}",
  share: "Share this role",
  shareX: "Share on X",
  shareLinkedIn: "Share on LinkedIn",
  copy: "Copy link",
  copied: "Link copied",
  copyFailed: "Copy failed — select the address bar instead",
} as const;

/** The application form's labels, choices and messages. */
export const APPLY_COPY = {
  formLabel: "Job application",
  personal: "About you",
  professional: "Your experience",
  links: "Résumé and links",
  extra: "Anything else",
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  phone: "Phone number",
  location: "Current location",
  locationHint: "City, state or country",
  experience: "Years of experience",
  noticePeriod: "Notice period",
  currentCTC: "Current CTC (LPA)",
  expectedCTC: "Expected CTC (LPA)",
  linkedin: "LinkedIn profile",
  portfolio: "Portfolio / GitHub",
  resume: "Résumé / CV",
  resumeHint: "PDF, DOC or DOCX, up to 5 MB",
  resumeNone: "No file chosen",
  resumeChoose: "Choose a file",
  resumeChange: "Change file",
  coverLetter: "Why do you want to join {company}?",
  referral: "How did you hear about this position?",
  select: "Select",
  consent:
    "I agree to the processing of my personal data for recruitment purposes. My information is kept confidential and used only to evaluate my application.",
  submit: "Submit application",
  busy: "Sending…",
  successTitle: "Application sent",
  successText:
    "Thank you for applying to {title} at {company}. We will get back to you within 48 hours.",
  successAction: "More roles at {company}",
  failed: "Your application could not be sent. Please check your connection and try again.",
  resumeRefused: "That file could not be accepted. Please attach a PDF, DOC or DOCX of up to 5 MB.",
  experienceOptions: [
    { value: "0-1", label: "0–1 years" },
    { value: "1-2", label: "1–2 years" },
    { value: "2-4", label: "2–4 years" },
    { value: "4-6", label: "4–6 years" },
    { value: "6-10", label: "6–10 years" },
    { value: "10+", label: "10+ years" },
  ],
  noticeOptions: [
    { value: "immediate", label: "Immediate" },
    { value: "15days", label: "15 days" },
    { value: "30days", label: "30 days" },
    { value: "60days", label: "60 days" },
    { value: "90days", label: "90 days" },
  ],
  referralOptions: [
    { value: "linkedin", label: "LinkedIn" },
    { value: "careers-page", label: "Company careers page" },
    { value: "indeed", label: "Indeed" },
    { value: "naukri", label: "Naukri" },
    { value: "referral", label: "Employee referral" },
    { value: "social-media", label: "Social media" },
    { value: "other", label: "Other" },
  ],
} as const;
