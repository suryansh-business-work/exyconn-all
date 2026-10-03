import type { InnerAction, SceneConfig } from "../../components/inner/types";
import { aiServiceCategories, aiServices, servicesInCategory } from "./aiServices";

/**
 * How the AI catalogue (/ai-services and each /ai-services/[slug]) presents the services in
 * ./aiServices: listing copy, the category order used as scene tags, and each category's
 * header scene. The services themselves stay in ./aiServices (also read by the home page).
 */
export const catalogueHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "AI that ships working systems, not pilots",
  lede: "Exyconn builds AI products and runs the services around them — agents that do real work, the platforms they run on, and the guardrails that keep them defensible in front of your customers.",
  primary: { label: "Get a quote", href: "/get-a-quote" },
  secondary: { label: "Talk to an engineer", href: "/contact" },
};

export const catalogueCopy = {
  filterLabel: "Filter AI services",
  sheetLabel: "Categories",
  chipsLabel: "Category",
  allLabel: "All",
  searchLabel: "Search",
  searchPlaceholder: "Search AI services",
  countTemplate: "{shown} of {total} services",
  empty: "No AI service matches that search. Clear the filters to see all of them.",
  more: "Explore service",
  serviceOne: "service",
  serviceMany: "services",
  chapterLabel: "Catalogue",
  chapterTitle: "Every AI service, by capability area",
  relatedLabel: "Explore",
  relatedTitle: "AI, services and the platform",
};

export const catalogueStats = () => [
  { value: String(aiServices.length), label: "AI services" },
  { value: String(aiServiceCategories.length), label: "Capability areas" },
];

export const catalogueCta: {
  title: string;
  text: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Tell us the process, we'll scope the AI",
  text: "Bring one workflow that costs your team too much time. We will come back with what an AI system can take over, what it should not, and what it costs to build.",
  primary: { label: "Get a quote", href: "/get-a-quote" },
  secondary: { label: "Book a consultation", href: "/contact" },
};

/** Filter link for one category on the listing, e.g. /ai-services?cat=trust-security. */
export const categoryHref = (slug: string): string => `/ai-services?cat=${slug}`;

/** Scene tag of a category on the listing's neural core: its position, counted from 1. */
export const categoryTag = (slug: string): number =>
  aiServiceCategories.findIndex((category) => category.slug === slug) + 1;

/** The listing's scene: a neural core with one agent module in orbit per category. */
export const catalogueScene = (): SceneConfig => ({
  shapes: ["neuralCore"],
  data: { neuralCore: { modules: aiServiceCategories.length } },
});

/**
 * A detail page's header scene, chosen by its category and sized by the category's services:
 * agents orbiting a neural core, data turned into a rising chart, an AI product served from
 * the cloud to its tenants, an AI chip wiring up the platform, a shield.
 */
export const sceneForCategory = (slug: string): SceneConfig => {
  const size = servicesInCategory(slug).length;
  switch (slug) {
    case "agents-automation":
      return { shapes: ["neuralCore"], data: { neuralCore: { modules: size } } };
    case "revenue-growth":
    case "business-operations":
      return { shapes: ["dataflow"] };
    case "vertical-platforms":
      return { shapes: ["cloudStack"] };
    case "platform-infrastructure":
      return { shapes: ["aiChip"], data: { aiChip: { pads: size } } };
    case "trust-security":
      return { shapes: ["shield"] };
    default:
      return { shapes: ["core"] };
  }
};

/** Copy of a service detail page (/ai-services/[slug]). */
export const detailCopy = {
  listing: "AI services",
  approachLabel: "Approach",
  approachTitle: "How we approach it",
  outcomesLabel: "Deliverables",
  outcomesTitle: "What you get",
  relatedLabel: "Related",
  relatedTitle: (category: string) => `More in ${category}`,
  more: "Explore service",
  scopeTitle: "Scope this for your business",
  scopeText:
    "Send us the workflow you want this applied to. You get a scope, a timeline and a price — not a discovery invoice.",
  categoryLink: "See the whole category",
  quote: { label: "Get a quote", href: "/get-a-quote" },
  talk: { label: "Talk to us", href: "/contact" },
};
