/**
 * Portal FIXTURES — local design work and tests only, never shipped.
 *
 * The live portal is empty while the site is being redesigned, so the populated layouts of
 * /blog, /case-studies, /our-tools and /sitemap are built against these rows: the unit tests
 * import them directly, and `astro dev` answers portal reads from `answerPortalQuery` when
 * started with PORTAL_FIXTURES=<absolute path of this file> (see src/lib/portal/client.ts —
 * production builds compile that branch away). Every row is invented sample content.
 */
import type { BlogPost, CaseStudy, NavLink, Tool, ToolCategory } from "../../src/lib/portal/types";

/** A flat 16:9 cover so the fixtures need no network. */
const cover = (from: string, to: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/></svg>`
  )}`;

const ARTICLE = `
<p class="lead">Most automation projects stall in the hand-off between a demo and the team that has to live with it.</p>
<h2>Start from the decision, not the model</h2>
<p>Write down the one decision the system makes, who reviews it and what a wrong answer costs.</p>
<h3>Measure the baseline first</h3>
<p>Time a week of the manual process. Without a baseline, every improvement is an anecdote.</p>
<h2>Keep a human in the loop where it matters</h2>
<ul><li><strong>Review queue:</strong> low-confidence cases go to a person.</li><li><strong>Audit trail:</strong> every action is logged with its inputs.</li></ul>
<blockquote>Automate the boring 80% and make the remaining 20% easier to review.</blockquote>
<h2>Ship small, then widen</h2>
<p>Launch on one workflow, one team and one region. Widen only when the review queue shrinks.</p>
<pre><code>pnpm run evals --suite claims</code></pre>
`;

const post = (
  index: number,
  slug: string,
  title: string,
  tags: string[],
  featured = false
): BlogPost => ({
  id: `post-${index}`,
  slug,
  title,
  summary:
    "A practical guide for teams moving from a promising prototype to a system people trust every day.",
  content: ARTICLE,
  contentCss: "",
  author: { name: "Exyconn Editorial", role: "Engineering", initials: "EE" },
  readTime: `${4 + index} min read`,
  tags,
  coverImage: cover(index % 2 ? "#1e1b4b" : "#0c4a6e", index % 2 ? "#7c3aed" : "#0ea5e9"),
  featured,
  publishedAt: `2026-0${9 - Math.min(index, 8)}-1${index}T09:00:00.000Z`,
});

export const FIXTURE_POSTS: BlogPost[] = [
  post(
    0,
    "agents-in-production",
    "Taking AI agents from demo to production",
    ["AI", "Agents"],
    true
  ),
  post(1, "evals-before-launch", "Write the evals before you write the prompt", ["AI", "Quality"]),
  post(2, "workflow-automation-roi", "Where workflow automation actually pays back", [
    "Automation",
  ]),
  post(3, "mcp-for-teams", "MCP servers explained for product teams", ["AI", "Integration"]),
  post(4, "saas-billing-lessons", "Five billing lessons from building SaaS", ["SaaS", "Product"]),
  post(5, "modernise-without-rewrite", "Modernising a legacy app without a rewrite", [
    "Engineering",
  ]),
  post(6, "data-pipelines-that-last", "Data pipelines that survive the second year", [
    "Data",
    "Engineering",
  ]),
];

const study = (
  index: number,
  slug: string,
  title: string,
  excerpt: string,
  category: string,
  tags: string[],
  featured = false
): CaseStudy => ({
  id: `study-${index}`,
  slug,
  title,
  excerpt,
  content: `${ARTICLE}<h2>Results</h2><p>${excerpt}</p>`,
  contentCss: "",
  coverImage: cover(index % 2 ? "#083344" : "#422006", index % 2 ? "#06b6d4" : "#f59e0b"),
  category,
  author: "Exyconn Delivery",
  tags,
  pdfUrl: index === 0 ? "https://example.com/case-study.pdf" : "",
  featured,
  publishedAt: `2026-0${8 - index}-0${index + 2}T09:00:00.000Z`,
});

export const FIXTURE_STUDIES: CaseStudy[] = [
  study(
    0,
    "claims-triage-agent",
    "Claims triage in hours, not days",
    "An AI agent pre-sorts incoming claims, cutting triage time by 62% and freeing 3 adjusters for complex cases.",
    "Insurance",
    ["AI agents", "Automation"],
    true
  ),
  study(
    1,
    "clinic-scheduling",
    "A clinic network that stopped double-booking",
    "Scheduling moved to one integrated system: no-shows fell 28% across 14 clinics.",
    "Healthcare",
    ["Integration", "Mobile"],
    true
  ),
  study(
    2,
    "retail-demand-forecast",
    "Forecasting demand for 2,400 stores",
    "A forecasting pipeline improved stock accuracy by 19% and reduced waste by 11%.",
    "Retail",
    ["Data & analytics"]
  ),
  study(
    3,
    "fleet-dispatch",
    "Dispatch that plans itself",
    "Route planning for a logistics fleet now runs in 4 minutes instead of 2 hours.",
    "Logistics",
    ["Automation", "SaaS"]
  ),
  study(
    4,
    "lending-portal",
    "A lending portal rebuilt for mobile",
    "Applications completed on phones rose 3x after the portal was modernised.",
    "Finance",
    ["Modernisation", "Mobile"]
  ),
];

export const FIXTURE_TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "c1",
    slug: "ai-writing",
    category: "AI writing",
    description: "Generators for everyday copy.",
    icon: "",
    color: "#7c3aed",
    order: 1,
  },
  {
    id: "c2",
    slug: "developer",
    category: "Developer",
    description: "Small utilities for builders.",
    icon: "",
    color: "rgb(6, 182, 212)",
    order: 2,
  },
  {
    id: "c3",
    slug: "brand",
    category: "Brand",
    description: "Names, logos and colours.",
    icon: "",
    color: "",
    order: 3,
  },
];

const tool = (
  index: number,
  categorySlug: string,
  toolCode: string,
  name: string,
  description: string,
  isMVP = false
): Tool => ({
  id: `tool-${index}`,
  toolCode,
  categorySlug,
  name,
  description,
  longDescription: `${description}\n\nRuns in the browser, free and without sign-up.`,
  url: `/tools/${toolCode}`,
  icon: "",
  color: "",
  features: ["Works in the browser", "No sign-up", "Copy or export the result"],
  useCases: ["Marketing teams", "Founders", "Agencies"],
  keywords: [name.toLowerCase()],
  pricing:
    index === 0
      ? {
          price: 0,
          currency: "USD",
          features: ["Unlimited use"],
          alterationNote: "Free while in beta.",
        }
      : null,
  isMVP,
  order: index,
});

export const FIXTURE_TOOLS: Tool[] = [
  tool(
    0,
    "ai-writing",
    "ai-blog-title-generator",
    "AI blog title generator",
    "Catchy, search-friendly titles for any topic."
  ),
  tool(
    1,
    "ai-writing",
    "ai-reply-generator",
    "AI reply generator",
    "Polite, on-brand replies to reviews and messages."
  ),
  tool(
    2,
    "ai-writing",
    "prompt-builder",
    "Prompt builder",
    "Structured prompts with role, context and checks.",
    true
  ),
  tool(3, "developer", "json-formatter", "JSON formatter", "Format, validate and minify JSON."),
  tool(
    4,
    "developer",
    "regex-tester",
    "Regex tester",
    "Test patterns against sample text with live matches."
  ),
  tool(
    5,
    "developer",
    "jwt-decoder",
    "JWT decoder",
    "Read a token's header and claims safely.",
    true
  ),
  tool(
    6,
    "brand",
    "brand-name-generator",
    "Brand name generator",
    "Short, available-sounding names for a new product."
  ),
  tool(
    7,
    "brand",
    "palette-maker",
    "Palette maker",
    "Accessible colour palettes from one brand colour."
  ),
];

const nav = (
  id: string,
  label: string,
  href: string,
  category: string,
  description: string
): NavLink => ({
  id,
  label,
  href,
  category,
  description,
  keywords: label.toLowerCase(),
});

export const FIXTURE_NAV_LINKS: NavLink[] = [
  nav("n1", "Home", "/", "General", "Start here."),
  nav("n2", "Contact", "/contact", "General", "Talk to the team."),
  nav("n3", "AI", "/ai", "AI", "Agents, models and workflows."),
  nav("n4", "AI agents", "/ai/agentic", "AI", "Agents that act on your systems."),
  nav("n5", "Services", "/services", "Services", "What we build."),
  nav(
    "n6",
    "Data & analytics",
    "/services/data-analytics",
    "Services",
    "Dashboards and pipelines."
  ),
  nav("n7", "Case studies", "/case-studies", "Case Studies", "Stories from delivery."),
  nav("n8", "About us", "/about-us", "Company", "Who we are."),
  nav("n9", "Careers", "/career", "Company", "Open roles and gigs."),
  nav("n10", "Unsafe", "javascript:alert(1)", "Company", "Must be filtered out."),
];

const ROOTS: Record<string, (variables: Record<string, unknown>) => unknown> = {
  publicBlogPosts: () => FIXTURE_POSTS,
  publicBlogPost: ({ slug }) => FIXTURE_POSTS.find((one) => one.slug === slug) ?? null,
  publicCaseStudies: () => FIXTURE_STUDIES,
  publicCaseStudy: ({ slug }) => FIXTURE_STUDIES.find((one) => one.slug === slug) ?? null,
  publicToolCategories: () => FIXTURE_TOOL_CATEGORIES,
  publicTools: ({ categorySlug }) =>
    FIXTURE_TOOLS.filter((one) => !categorySlug || one.categorySlug === categorySlug),
  publicTool: ({ toolCode }) => FIXTURE_TOOLS.find((one) => one.toolCode === toolCode) ?? null,
  publicNavLinks: () => FIXTURE_NAV_LINKS,
};

/** Answers one portal read the way the portal would; anything unknown fails like a portal error. */
export function answerPortalQuery(query: string, variables: Record<string, unknown>): unknown {
  const root = /\{\s*(\w+)/.exec(query)?.[1] ?? "";
  const answer = ROOTS[root];
  if (!answer) {
    throw new Error(`No portal fixture for ${root}`);
  }
  return { [root]: answer(variables) };
}
