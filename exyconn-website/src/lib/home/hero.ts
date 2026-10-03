import { TOOLS_SITE_URL } from "../site";

/**
 * The home page's opening chapter — the words the hero banner has always carried, now
 * shared with the scroll-driven home stage.
 */
export interface HomeAction {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
}

export const heroCopy = {
  badge: "AI Products & Services",
  headline: "AI That Does the Work.",
  headlineSecond: "Not Just the Talking.",
  description: (serviceCount: number): string =>
    `We build AI agents, automation and vertical AI products that run real operations — sales, support, finance, hiring and logistics — across ${serviceCount} service areas, on the systems you already use.`,
  scrollHint: "Scroll to explore",
} as const;

export const heroActions: readonly HomeAction[] = [
  { label: "Explore AI Services", href: "/ai-services", icon: "fa-bolt" },
  { label: "View Products", href: "/our-products", icon: "fa-cube" },
  { label: "Free Tools", href: TOOLS_SITE_URL, icon: "fa-toolbox", external: true },
];

export const heroStats: readonly { value: string; label: string }[] = [
  { value: "1 Week", label: "Launch Time" },
  { value: "60%", label: "Cost Savings" },
  { value: "99.9%", label: "Uptime" },
];

export const heroFeatures: readonly { icon: string; title: string; text: string }[] = [
  {
    icon: "fa-robot",
    title: "AI Agents",
    text: "Autonomous systems that work 24/7, handling tasks intelligently.",
  },
  {
    icon: "fa-shield-halved",
    title: "Authentication",
    text: "Complete auth with OAuth 2.0, MFA, and RBAC support.",
  },
  {
    icon: "fa-cube",
    title: "SaaS Products",
    text: "Full-featured B2B and B2B2C platforms ready to deploy.",
  },
  {
    icon: "fa-code",
    title: "Developer Tools",
    text: "APIs, SDKs, and infrastructure tools for rapid development.",
  },
];
