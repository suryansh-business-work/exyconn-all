/**
 * Every link the site chrome shows — header menus, the phone menu and the footer — declared
 * once. Hrefs are unprefixed: the middleware's `localiseLinks` adds the reader's market.
 */
import { TOOLS_SITE_URL } from "../site";

export interface NavLink {
  label: string;
  href: string;
  /** One line under the label in the menus. */
  text?: string;
  /** Leaves the site: opens in a new tab, announced to screen readers. */
  external?: boolean;
}

export interface NavGroup {
  /** Unique; ids of the menu's button and panel are built from it. */
  id: string;
  label: string;
  links: readonly NavLink[];
  /** The hub page the group belongs to, shown at the foot of its menu. */
  overview?: NavLink;
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

/** The header's dropdowns, in order; Blog sits between Services and Company. */
export const HEADER_MENUS: readonly NavGroup[] = [AI, SERVICES, COMPANY];

export const BLOG_LINK: NavLink = { label: "Blog", href: "/blog" };

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
    { label: "Sibera", href: "https://sibera.work", external: true },
    { label: "Spentiva", href: "https://spentiva.com", external: true },
    { label: "Duncit", href: "https://duncit.com", external: true },
    { label: "Free tools", href: TOOLS_SITE_URL, external: true },
  ],
};

/** The footer's link columns: the header groups (with their hubs first) plus products. */
export const FOOTER_COLUMNS: readonly NavGroup[] = [
  { ...AI, links: [{ label: "AI platform", href: "/ai" }, ...AI.links] },
  { ...SERVICES, links: [{ label: "All services", href: "/our-services" }, ...SERVICES.links] },
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
