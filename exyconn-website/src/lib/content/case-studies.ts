/**
 * Case-study shaping: the metrics a story already states (pulled from its own words — never
 * invented), the data terrain scene built from them, and the page copy.
 */
import type { CaseStudy } from "../portal/types";

export interface StoryMetric {
  /** As written in the story, e.g. "62%" or "3x". */
  value: string;
  /** The number, for the terrain's bar heights. */
  amount: number;
  /** The clause that states it, without the number, e.g. "Cutting triage time". */
  label: string;
}

const METRIC = /(\d[\d,]*(?:\.\d+)?)\s?(%|x\b|×)/i;
const CLAUSE_BREAK = /[.;:!?]\s|,\s|\s(?:and|while|with)\s/i;
const MAX_LABEL = 72;
const MAX_BARS = 16;
/** A flat floor of low bars: what the terrain shows before any story states a number. */
const FLAT_TERRAIN = 8;

const sentenceCase = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const clip = (text: string): string =>
  text.length > MAX_LABEL ? `${text.slice(0, MAX_LABEL - 1).trimEnd()}…` : text;

/** The clause without its number: "Cutting triage time by 62%" → "Cutting triage time". */
const labelOf = (clause: string, token: string): string =>
  clip(
    sentenceCase(
      clause
        .replace(token, "")
        .replace(/\.$/, "")
        .replace(/\s+(?:by|to|of|at|in)\s*$/i, "")
        .replaceAll(/\s{2,}/g, " ")
        .trim()
    )
  );

/** Every percentage or multiplier a text states, in order, with the clause around it. */
export const extractMetrics = (text: string, max = 4): StoryMetric[] =>
  text
    .split(CLAUSE_BREAK)
    .map((clause) => clause.trim())
    .flatMap((clause) => {
      const match = METRIC.exec(clause);
      if (!match) {
        return [];
      }
      const [token, number, unit] = match;
      return [
        {
          value: `${number}${unit === "%" ? "%" : "x"}`,
          amount: Number.parseFloat(number.replaceAll(",", "")),
          label: labelOf(clause, token),
        },
      ];
    })
    .slice(0, max);

/**
 * What one story states in its excerpt — the summary its author wrote as the headline
 * result. (Numbers elsewhere in the body may be context, not outcomes.)
 */
export const storyMetrics = (study: CaseStudy, max = 4): StoryMetric[] =>
  extractMetrics(study.excerpt, max);

const flat = (): number[] => Array.from({ length: FLAT_TERRAIN }, () => 0);

/**
 * The list page's terrain: each story's headline metric (featured stories first); stories
 * without one count toward their industry instead. No stories → a flat floor.
 */
export const listTerrain = (studies: readonly CaseStudy[]): number[] => {
  const ordered = [...studies.filter((s) => s.featured), ...studies.filter((s) => !s.featured)];
  const metrics = ordered.flatMap((study) => storyMetrics(study, 1).map((m) => m.amount));
  if (metrics.length > 0) {
    return metrics.slice(0, MAX_BARS);
  }
  const perIndustry = new Map<string, number>();
  studies.forEach((s) => perIndustry.set(s.category, (perIndustry.get(s.category) ?? 0) + 1));
  return perIndustry.size > 0 ? [...perIndustry.values()].slice(0, MAX_BARS) : flat();
};

/** One story's terrain: its own stated numbers, or a flat floor when it states none. */
export const storyTerrain = (metrics: readonly StoryMetric[]): number[] =>
  metrics.length > 0 ? metrics.map((metric) => metric.amount) : flat();

export const CASE_STUDIES_COPY = {
  metaTitle: "Case Studies | AI Success Stories | Exyconn",
  metaDescription:
    "Explore real-world case studies showcasing how Exyconn delivers AI and automation solutions that drive measurable business results across industries.",
  crumb: "Case studies",
  title: "Real projects, measurable outcomes",
  lede: "How businesses put AI, automation and modern software to work — and what changed.",
  countLabel: "{count} published stories",
  resultsLabel: "Results",
  filterLabel: "Filter case studies",
  sheetLabel: "Filters",
  industryLabel: "Industry",
  serviceLabel: "Service",
  all: "All",
  searchLabel: "Search stories",
  searchPlaceholder: "Client, industry or service",
  sortLabel: "Sort",
  sortFeatured: "Featured first",
  sortNewest: "Newest",
  sortOldest: "Oldest",
  countTemplate: "{shown} of {total} stories",
  chapterLabel: "Stories",
  chapterTitle: "Outcomes our clients measured",
  emptyChapterTitle: "Client stories",
  featured: "Featured",
  read: "Read the story",
  noMatch: "No story matches those filters.",
  emptyLabel: "Nothing published yet",
  emptyTitle: "Our first case studies are on their way",
  emptyText:
    "Client stories appear here as they are published. Meanwhile, see the services and AI work behind them.",
  emptyPrimary: { label: "Our services", href: "/services" },
  emptySecondary: { label: "AI solutions", href: "/ai" },
  ctaLabel: "Your project",
  ctaTitle: "Start a story of your own",
  ctaText: "Tell us the outcome you need. We reply within 24 hours.",
  ctaPrimary: { label: "Get a quote", href: "/get-a-quote" },
  ctaSecondary: { label: "Contact", href: "/contact" },
} as const;

export const CASE_STUDY_COPY = {
  home: "Home",
  list: "Case studies",
  toc: "On this page",
  resultsLabel: "Results",
  snapshot: "Snapshot",
  industry: "Industry",
  services: "Services",
  published: "Published",
  author: "Written by",
  pdf: "Download PDF",
  back: "All case studies",
  ctaLabel: "Your project",
  ctaTitle: "Start a similar project",
  ctaText: "Tell us where you are today; we will show you how we would approach it.",
  ctaPrimary: { label: "Get a quote", href: "/get-a-quote" },
  ctaSecondary: { label: "All case studies", href: "/case-studies" },
} as const;
