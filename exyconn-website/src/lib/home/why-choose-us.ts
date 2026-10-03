/**
 * "Why Choose Exyconn" — rendered by WhyChooseUs.astro (about-us) and by the home stage.
 * Tile and ink classes are written out in full so Tailwind can find them.
 */
export const whyChooseUsCopy = {
  badgeIcon: "fa-shield-check",
  badge: "The AI-First Technology Partner",
  title: "Why Leading Enterprises Choose",
  accent: "Exyconn",
  lead: "We don't just build AI—we architect intelligent systems that transform how businesses operate. Our unique combination of deep AI expertise and enterprise SaaS experience delivers measurable results.",
  image: {
    src: "https://images.pexels.com/photos/3861973/pexels-photo-3861973.jpeg?auto=compress&w=800&q=80",
    alt: "Exyconn AI Team",
  },
} as const;

export const whyChooseUsStats: readonly { value: string; label: string; ink: string }[] = [
  { value: "98%", label: "Client Retention", ink: "text-cyan-fg" },
  { value: "500+", label: "AI Deployments", ink: "text-indigo-fg" },
];

export interface ValueProp {
  icon: string;
  /** Solid tile behind the icon, with its coloured shadow. */
  tile: string;
  title: string;
  text: string;
}

export const whyChooseUsValues: readonly ValueProp[] = [
  {
    icon: "fa-rocket",
    tile: "bg-cyan-deep shadow-cyan/20",
    title: "Production-Ready AI",
    text: "Deploy AI agents that work in production from day one—not proofs of concept.",
  },
  {
    icon: "fa-cloud",
    tile: "bg-indigo shadow-indigo/20",
    title: "SaaS-Native Platforms",
    text: "Our platforms are built cloud-first with enterprise security and 99.9% uptime.",
  },
  {
    icon: "fa-bolt",
    tile: "bg-emerald-deep shadow-emerald/20",
    title: "10x Faster Delivery",
    text: "Pre-built components and AI accelerators cut implementation time by 90%.",
  },
  {
    icon: "fa-handshake",
    tile: "bg-orange-deep shadow-orange/20",
    title: "End-to-End Partnership",
    text: "From strategy through deployment to 24/7 support—we're with you all the way.",
  },
];

export const whyChooseUsActions: readonly { href: string; icon: string; label: string }[] = [
  { href: "/case-studies", icon: "fa-chart-column", label: "View Case Studies" },
  { href: "/contact", icon: "fa-calendar-check", label: "Schedule Demo" },
];
