import type { InnerAction } from "../../components/inner/types";
import { capabilityGroups } from "../services/aiHub";
import { catalogServices } from "../services/catalog";

/** Content of /about-us — the copy and figures the page already carried, regrouped. */
export const aboutMeta = {
  title: "About Us | Our Story & Mission | Exyconn",
  description:
    "Learn about Exyconn's mission, vision, and values. Meet our team of AI, automation, and digital transformation experts dedicated to helping your business thrive.",
  keywords:
    "about Exyconn, our team, AI experts, automation, digital transformation, company values, mission, vision",
  image:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
};

export const aboutHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Building the future of AI and SaaS",
  lede: "We're a team of passionate technologists, strategists, and innovators dedicated to helping businesses thrive in the digital era through AI, automation, and digital expertise.",
  primary: { label: "Work with us", href: "/contact" },
  secondary: { label: "Our vision", href: "/our-vision" },
};

/** The four figures the page has always shown. */
export const aboutStats = [
  { value: "2022", label: "Founded" },
  { value: "15+", label: "Team members" },
  { value: "50+", label: "Projects delivered" },
  { value: "100%", label: "Client satisfaction" },
];

export const aboutChapters = {
  thesis: { label: "Why we exist", title: "Technology that moves a business forward" },
  work: {
    label: "What we do",
    title: "Five ways we help",
    lede: "We deliver comprehensive solutions across AI, automation, and digital transformation.",
    more: "Explore",
  },
  values: {
    label: "What we believe",
    title: "The principles that guide everything we do",
  },
  reach: {
    label: "Where we work",
    title: "Remote-first, published worldwide",
    /** {markets}, {countries}, {languages} come from the market registry. */
    text: "As a remote-first company, we collaborate with clients globally — this site is published for {markets} markets in {countries} countries and {languages} languages.",
    facts: { markets: "Markets", countries: "Countries", languages: "Languages" },
    caption: "Each arc on the globe joins two markets that read the site in the same language.",
  },
  next: { label: "Keep exploring", title: "More about Exyconn" },
};

/** Mission and vision, as the page stated them. */
export const aboutThesis = [
  {
    title: "Our mission",
    text: "To empower organizations with innovative technology, creativity, and expertise—enabling them to achieve their full potential and stay ahead in a rapidly evolving world.",
  },
  {
    title: "Our vision",
    text: "To be a global leader in AI-driven transformation, enabling smarter, faster, and more efficient business outcomes for our clients worldwide.",
  },
];

/** "What we do" — the page's five labels, each with the summary its own page already uses. */
const WORK_ITEMS = [
  { title: "AI agents & automation", href: "/ai/agentic" },
  { title: "SaaS & custom software", href: "/services/software-as-a-service" },
  { title: "Digital consulting & strategy", href: "/services/digital-consulting" },
  { title: "Data analytics & integration", href: "/services/data-analytics" },
  { title: "Ongoing support & optimization", href: "/services/maintenance" },
];

interface Summarised {
  href: string;
  text: string;
}

/** The summary each item's page carries; throws at build time if a page lost its summary. */
export const withSummaries = (
  items: readonly { title: string; href: string }[],
  sources: readonly Summarised[]
) =>
  items.map((item) => {
    const source = sources.find((candidate) => candidate.href === item.href);
    if (!source) {
      throw new Error(`No summary for ${item.href}`);
    }
    return { ...item, text: source.text };
  });

const SUMMARIES: Summarised[] = [
  ...catalogServices().map(({ href, summary }) => ({ href, text: summary })),
  ...capabilityGroups.flatMap((group) => group.cards.map(({ href, text }) => ({ href, text }))),
];

export const aboutWork = withSummaries(WORK_ITEMS, SUMMARIES);

export const aboutValues = [
  {
    title: "Innovation",
    text: "We embrace new ideas and technologies to deliver cutting-edge solutions.",
  },
  {
    title: "Collaboration",
    text: "We believe in strong partnerships and teamwork with our clients.",
  },
  {
    title: "Integrity",
    text: "We act with honesty, transparency, and ethical business practices.",
  },
  { title: "Excellence", text: "We strive for the highest quality in everything we create." },
];

export const aboutNext = [
  {
    title: "Our vision",
    text: "Where we are heading, and the principles that set the course.",
    href: "/our-vision",
  },
  {
    title: "Careers",
    text: "Open roles and gigs on a remote-first team.",
    href: "/career",
  },
  {
    title: "Case studies",
    text: "What we have built with our clients.",
    href: "/case-studies",
  },
];

export const aboutCta: { title: string; text: string; primary: InnerAction } = {
  title: "Ready to transform your business with AI?",
  text: "Partner with Exyconn to unlock the power of AI automation, intelligent agents, and enterprise SaaS.",
  primary: { label: "Schedule a consultation", href: "/contact" },
};

/** Fills the reach chapter's {placeholders}. */
export const fillTemplate = (template: string, values: Readonly<Record<string, number>>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );
