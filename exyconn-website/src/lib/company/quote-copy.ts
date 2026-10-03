/** Words on /get-a-quote. The options and the arithmetic live in ./quote.ts. */
export const quoteMeta = {
  title: "Get a Quote | Project Budget Calculator | Exyconn",
  description:
    "Use Exyconn's Software Budget Calculator to estimate your project costs. Select project type, team composition, and timeline for an instant budget estimate.",
  keywords:
    "get a quote, software budget calculator, project estimate, AI development, SaaS pricing, Exyconn",
  image:
    "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&w=1200&q=80",
};

export const quoteBand = {
  title: "Estimate your project in minutes",
  lede: "Get an instant estimate for your software project. Configure your team, timeline, and requirements.",
};

export const QUOTE_STEPS = ["Service", "Scope", "Contact", "Review"] as const;

export const quoteText = {
  progress: "Step {current} of {total}",
  formLabel: "Project budget calculator",
  back: "Back",
  next: "Continue",
  send: "Send my estimate",
  sending: "Sending…",
  service: { legend: "Project type", describe: "Describe your project" },
  scope: {
    team: "Team composition",
    role: "Role",
    count: "Count",
    rate: "Rate/hr (USD)",
    customName: "Custom role name",
    addRole: "Add team member",
    removeRole: "Remove {role}",
    duration: "Project duration",
    customMonths: "Custom duration (months)",
    hours: "Work commitment",
    hoursUnit: "h/month",
  },
  contact: {
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    company: "Company name",
    notes: "Anything else we should know?",
  },
  review: {
    title: "Check and send",
    lede: "We'll receive this estimate with your details and reply by email.",
    edit: "Edit",
  },
  summary: {
    title: "Estimated budget",
    projectType: "Project type",
    team: "Team size",
    duration: "Duration",
    hours: "Work hours",
    base: "Base cost",
    complexity: "Complexity",
    members: "members",
    note: "This is an estimate based on your selections. Final costs may vary based on specific requirements.",
    download: "Download summary (.txt)",
  },
  sent: "Thank you — your estimate is with our team. We'll reply by email.",
  failed: "Something went wrong. Please try again.",
};

/** What happens after a visitor sends an estimate — what the site actually does with it. */
export const quoteNextSteps = [
  {
    title: "Your estimate reaches our team",
    text: "The selections, total and your notes arrive together.",
  },
  { title: "We reply by email", text: "To the address you gave, to talk through scope." },
  {
    title: "We shape it into a plan",
    text: "Team, timeline and budget refined with you.",
  },
];

export const quoteAfter = {
  label: "What happens next",
  title: "After you send your estimate",
  talkText: "Rather talk it through? Send us a message instead.",
  talkAction: { label: "Contact us", href: "/contact" },
};
