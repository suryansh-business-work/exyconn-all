import type { DetailSection } from "./schema";

/** The template's own words (chapter labels, links, tab controls) — the same on every page. */
interface Action {
  label: string;
  href: string;
}

export const DETAIL_COPY = {
  chapters: {
    intro: "What it is",
    architecture: "Architecture",
    offerings: { ai: "Use cases", services: "What we deliver" },
    tabs: "Explore",
    process: "How we work",
    faq: "FAQ",
    related: { ai: "More AI capabilities", services: "Related services" },
  },
  faqTitle: (name: string): string => `Questions about ${name}`,
  relatedTitle: { ai: "Keep exploring AI", services: "Explore related services" },
  relatedMore: "Explore",
  /** The hero's ghost link: the overlapping catalogue for this section. */
  hub: {
    ai: { label: "Browse AI services", href: "/ai-services" },
    services: { label: "All services", href: "/services" },
  } satisfies Record<DetailSection, Action>,
  ctaTitle: (name: string): string => `Start with ${name}`,
  cta: {
    label: "Next step",
    secondary: { label: "Get a quote", href: "/get-a-quote" },
  },
  tabs: {
    previous: "Previous",
    next: "Next",
    position: (current: number, total: number): string =>
      `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
  },
} as const;
