/**
 * Every link the site chrome shows — header menus, the phone menu and the footer — declared
 * once. Hrefs are unprefixed: the middleware's `localiseLinks` adds the reader's market.
 */
import { DEMOS_SITE_URL, TOOLS_SITE_URL } from "../site";

export interface NavLink {
  label: string;
  href: string;
  /** One line under the label in the menus. */
  text?: string;
  /** Leaves the site: opens in a new tab, announced to screen readers. */
  external?: boolean;
  /** Drawn in the accent colour, to stand out from the links around it. */
  highlight?: boolean;
}

export interface NavGroup {
  /** Unique; ids of the menu's button and panel are built from it. */
  id: string;
  label: string;
  links: readonly NavLink[];
  /** The hub page the group belongs to, shown at the foot of its menu. */
  overview?: NavLink;
  /** A long list: the menu opens as a three-column panel across the header. */
  wide?: boolean;
}

const AI: NavGroup = {
  id: "ai",
  label: "AI",
  links: [
    { label: "Agentic AI", href: "/ai/agentic", text: "Autonomous agents for business" },
    { label: "Bot creation", href: "/ai/bot-creation", text: "Conversational AI bots" },
    { label: "Workflows", href: "/ai/workflows", text: "AI-driven process automation" },
    { label: "LLMs", href: "/ai/llms", text: "Large language models" },
    {
      label: "Custom training",
      href: "/ai/custom-model-training",
      text: "Models tuned on your data",
    },
    { label: "AI models", href: "/ai/models", text: "Ready-to-use models" },
    { label: "MCP server", href: "/ai/mcp-server", text: "AI pipeline infrastructure" },
  ],
  overview: { label: "Explore all AI solutions", href: "/ai" },
};

const SERVICES: NavGroup = {
  id: "services",
  label: "Services",
  links: [
    {
      label: "Digital consulting",
      href: "/services/digital-consulting",
      text: "Strategy & transformation",
    },
    {
      label: "Software-as-a-Service",
      href: "/services/software-as-a-service",
      text: "Scalable SaaS products",
    },
    {
      label: "App modernization",
      href: "/services/application-modernization",
      text: "Upgrade legacy systems",
    },
    {
      label: "Enterprise apps",
      href: "/services/enterprise-application",
      text: "Robust enterprise solutions",
    },
    {
      label: "Mobile development",
      href: "/services/mobile-application-development",
      text: "iOS & Android apps",
    },
    { label: "Data & analytics", href: "/services/data-analytics", text: "Data-driven insights" },
    {
      label: "Automation & integration",
      href: "/services/automation-integration",
      text: "Connect your systems",
    },
    {
      label: "WhatsApp chatbot",
      href: "/services/whatsapp-chatbot",
      text: "Live demo inside WhatsApp",
    },
    {
      label: "AI calling bot",
      href: "/services/calling-bot-demo",
      text: "Voice agent that answers calls",
    },
    { label: "Maintenance", href: "/services/maintenance", text: "Keep software healthy" },
    {
      label: "Digital marketing",
      href: "/services/digital-marketing",
      text: "SEO, PPC, social & more",
    },
    {
      label: "Outsourcing",
      href: "/services/software-development-outsourcing",
      text: "Software dev outsourcing",
    },
    { label: "India offer", href: "/india/offer", text: "₹4,999 से शुरू" },
  ],
  overview: { label: "Explore all services", href: "/our-services" },
};

/** The industries hub, at the foot of the menu and first in the footer row. */
const INDUSTRIES_HUB: NavLink = { label: "All industries we serve", href: "/industries" };

export const INDUSTRIES: NavGroup = {
  id: "industries",
  label: "Industries",
  wide: true,
  links: [
    {
      label: "Hospitality & hotels",
      href: "/industries/hospitality",
      text: "Guests, bookings, housekeeping",
    },
    {
      label: "Cafés & coffee shops",
      href: "/industries/cafes-coffee-shops",
      text: "Orders, regulars, stock",
    },
    { label: "Restaurants", href: "/industries/restaurants", text: "Tables, orders, food cost" },
    {
      label: "Travel & tourism",
      href: "/industries/travel-tourism",
      text: "Itineraries, bookings, support",
    },
    {
      label: "Healthcare & clinics",
      href: "/industries/healthcare",
      text: "Appointments, records, claims",
    },
    {
      label: "Beauty & wellness",
      href: "/industries/beauty-wellness",
      text: "Bookings, no-shows, packages",
    },
    {
      label: "Fitness & sports",
      href: "/industries/fitness-sports",
      text: "Trials, classes, renewals",
    },
    {
      label: "Events & entertainment",
      href: "/industries/events-entertainment",
      text: "Tickets, attendees, check-in",
    },
    { label: "Real estate", href: "/industries/real-estate", text: "Leads, site visits, handover" },
    {
      label: "Construction",
      href: "/industries/construction",
      text: "Site reports, materials, safety",
    },
    {
      label: "Manufacturing",
      href: "/industries/manufacturing",
      text: "Maintenance, quality, planning",
    },
    {
      label: "Automotive & dealerships",
      href: "/industries/automotive",
      text: "Test drives, service, finance",
    },
    {
      label: "Retail & e-commerce",
      href: "/industries/retail-ecommerce",
      text: "Discovery, carts, returns",
    },
    {
      label: "Logistics & transport",
      href: "/industries/logistics",
      text: "Tracking, dispatch, POD",
    },
    {
      label: "Education & EdTech",
      href: "/industries/education",
      text: "Admissions, fees, tutoring",
    },
    { label: "Startups & SaaS", href: "/industries/startups-saas", text: "Support, demos, churn" },
    {
      label: "Banking, finance & insurance",
      href: "/industries/bfsi",
      text: "KYC, loans, claims, collections",
    },
    {
      label: "Legal & consulting",
      href: "/industries/legal",
      text: "Intake, contracts, deadlines",
    },
    {
      label: "Professional services",
      href: "/industries/professional-services",
      text: "Proposals, documents, billing",
    },
    {
      label: "HR & recruitment",
      href: "/industries/hr-recruitment",
      text: "Screening, interviews, onboarding",
    },
  ],
  overview: INDUSTRIES_HUB,
};

/** The demos site's landing page, highlighted wherever it is listed. */
const ALL_DEMOS: NavLink = {
  label: "All demos",
  href: DEMOS_SITE_URL,
  external: true,
  highlight: true,
};

/** Every live demo opens on demos.exyconn.com. */
const DEMOS: NavGroup = {
  id: "demos",
  label: "Demos",
  links: [
    {
      label: "WhatsApp demo",
      href: `${DEMOS_SITE_URL}/whatsapp-demo/`,
      text: "Chat with automated businesses",
      external: true,
    },
    {
      label: "AI calling bot demo",
      href: `${DEMOS_SITE_URL}/calling-bot-demo/`,
      text: "Talk to a voice agent live",
      external: true,
    },
  ],
  overview: ALL_DEMOS,
};

const COMPANY: NavGroup = {
  id: "company",
  label: "Company",
  links: [
    { label: "About Exyconn", href: "/about-us", text: "Our mission and team" },
    { label: "Our vision", href: "/our-vision", text: "Our goals for the future" },
    { label: "Careers", href: "/career", text: "Join our growing team" },
    { label: "Case studies", href: "/case-studies", text: "See our success stories" },
    { label: "Contact us", href: "/contact", text: "Get in touch with our team" },
    { label: "Get a quote", href: "/get-a-quote", text: "Calculate your project budget" },
    { label: "Grievance", href: "/grievance", text: "Complaints or feedback" },
    { label: "Legal", href: "/legal", text: "Terms and legal information" },
    { label: "Free tools", href: TOOLS_SITE_URL, text: "SEO, AI & business tools", external: true },
  ],
};

/** The header's dropdowns, in order; Blog sits between Demos and Company. */
export const HEADER_MENUS: readonly NavGroup[] = [AI, SERVICES, INDUSTRIES, DEMOS, COMPANY];

/** The footer's full-width row of every industry page, under the link columns. */
export const FOOTER_INDUSTRIES: NavGroup = {
  ...INDUSTRIES,
  links: [INDUSTRIES_HUB, ...INDUSTRIES.links],
};

export const BLOG_LINK: NavLink = { label: "Blog", href: "/blog" };

/** The highlighted header item: the GCC-in-India cost guide (the calculator links from it). */
export const GCC_LINK: NavLink = {
  label: "GCC in India",
  href: "/gcc-in-india/cost-guide",
  text: "Plan and cost your India centre",
};

/** The header's two calls to action. */
export const HEADER_ACTIONS = {
  secondary: { label: "AI services", href: "/ai-services" },
  primary: { label: "Get started", href: "/contact" },
} as const satisfies Record<string, NavLink>;

/** The slim strip above the header. */
export const PROMO_LINK: NavLink = {
  label: "Free SEO, AI & business automation tools",
  href: TOOLS_SITE_URL,
  text: "New",
  external: true,
};

/** Shortcuts the phone menu lists after the groups. */
export const MOBILE_SHORTCUTS: readonly NavLink[] = [
  { label: "Home", href: "/" },
  BLOG_LINK,
  { label: "AI services", href: "/ai-services" },
  { label: "Exyconn services", href: "/exyconn-services" },
  { label: "Free tools", href: TOOLS_SITE_URL, external: true },
];

const PRODUCTS: NavGroup = {
  id: "products",
  label: "Products",
  links: [
    { label: "AI services", href: "/ai-services" },
    { label: "Duncit", href: "https://duncit.com", external: true },
    { label: "Free tools", href: TOOLS_SITE_URL, external: true },
  ],
};

/** The footer's link columns: the header groups (with their hubs first) plus products. */
export const FOOTER_COLUMNS: readonly NavGroup[] = [
  { ...AI, links: [{ label: "AI platform", href: "/ai" }, ...AI.links] },
  { ...SERVICES, links: [{ label: "All services", href: "/our-services" }, ...SERVICES.links] },
  { ...DEMOS, links: [ALL_DEMOS, ...DEMOS.links] },
  PRODUCTS,
  {
    ...COMPANY,
    links: [
      ...COMPANY.links.filter((link) => !link.external),
      BLOG_LINK,
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
];

/** The bottom bar's legal links. */
export const LEGAL_LINKS: readonly NavLink[] = [
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms of service", href: "/legal" },
  { label: "Cookies", href: "/cookies" },
  { label: "Sitemap", href: "/sitemap" },
];

/** The footer's one line about the company. */
export const FOOTER_TAGLINE =
  "Empowering businesses with AI-native intelligence and enterprise-ready SaaS solutions. From idea to MVP in weeks, not months.";

/** Zero-padded position for the mono index beside a menu item: 1 → "01". */
export const menuIndex = (position: number): string => String(position).padStart(2, "0");
