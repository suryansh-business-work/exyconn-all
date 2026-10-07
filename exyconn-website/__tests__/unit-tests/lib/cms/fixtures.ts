/** CMS and portal rows for the CMS tests: full records, with only what a test needs changed. */
import type { CmsBlock } from "@exyconn/cms";
import type { AiServiceCategory } from "../../../../src/lib/cms/ai-services";
import type {
  CmsPageData,
  CmsPublicPage,
  CmsPublicSite,
  CmsSite,
} from "../../../../src/lib/cms/types";
import type {
  BlogPost,
  CaseStudy,
  PublicPolicy,
  Tool,
  ToolCategory,
} from "../../../../src/lib/portal/types";
import type { NewsletterIssue } from "../../../../src/lib/portal/newsletter";

export const CATEGORIES: AiServiceCategory[] = [
  {
    slug: "conversational",
    title: "Conversational AI",
    description: "Talk to customers",
    icon: "fa-comments",
    services: [
      { slug: "chatbots", title: "Chatbots", summary: "Bots", icon: "fa-robot" },
      { slug: "voice", title: "Voice agents", summary: "Calls", icon: "fa-phone" },
    ],
  },
  {
    slug: "predictive",
    title: "Predictive AI",
    description: "See ahead",
    icon: "fa-chart-line",
    services: [
      { slug: "forecasting", title: "Forecasting", summary: "Demand", icon: "fa-chart-area" },
    ],
  },
];

export const catalogueBlock = (categories: readonly AiServiceCategory[]): CmsBlock => ({
  kind: "component",
  key: "aiservice.catalogue",
  props: { categories },
  children: [],
});

export const component = (
  key: string,
  props: Record<string, unknown> = {},
  children: CmsBlock[] = []
): CmsBlock => ({ kind: "component", key, props, children });

export const cmsSite = (overrides: Partial<CmsSite> = {}): CmsSite => ({
  id: "site-1",
  name: "Exyconn",
  slug: "exyconn",
  domains: [],
  isDefault: true,
  markets: true,
  defaultLocale: "en-US",
  faviconUrl: "",
  seo: { titleTemplate: "%s", description: "Site description", ogImageUrl: "/site-og.png" },
  headerFragmentId: "",
  footerFragmentId: "",
  headHtml: "",
  bodyEndHtml: "",
  globalCss: "",
  ...overrides,
});

export const publicSite = (overrides: Partial<CmsSite> = {}): CmsPublicSite => ({
  site: cmsSite(overrides),
  designSystem: null,
  fragments: [],
});

export const pageData = (overrides: Partial<CmsPageData> = {}): CmsPageData => ({
  id: "page-1",
  path: "/",
  kind: "PAGE",
  title: "Page",
  seo: {
    title: "",
    description: "",
    keywords: "",
    ogImageUrl: "",
    canonical: "",
    noindex: false,
    jsonLd: null,
  },
  layout: "default",
  blocks: [],
  css: "",
  params: {},
  preview: false,
  ...overrides,
});

export const publicPage = (overrides: Partial<CmsPageData> = {}): CmsPublicPage => ({
  page: pageData(overrides),
  fragments: [],
});

export const blogPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: "post-1",
  slug: "hello",
  title: "Hello",
  summary: "A first post",
  content: "<p>Hi</p>",
  contentCss: "",
  author: { name: "Ada", role: "Engineer", initials: "A" },
  readTime: "3 min read",
  tags: ["AI", "Agents"],
  coverImage: "/covers/hello.png",
  featured: false,
  publishedAt: "2026-09-01T09:00:00.000Z",
  ...overrides,
});

export const caseStudy = (overrides: Partial<CaseStudy> = {}): CaseStudy => ({
  id: "cs-1",
  slug: "claims",
  title: "Claims triage",
  excerpt: "Cut triage time by 62%.",
  content: "<p>Story</p>",
  contentCss: "",
  coverImage: "https://cdn.test/claims.png",
  category: "Insurance",
  author: "Exyconn",
  tags: ["AI"],
  pdfUrl: "",
  featured: false,
  publishedAt: "2026-08-01T09:00:00.000Z",
  ...overrides,
});

export const toolCategory = (overrides: Partial<ToolCategory> = {}): ToolCategory => ({
  id: "tc-1",
  slug: "developer",
  category: "Developer tools",
  description: "",
  icon: "",
  color: "",
  order: 1,
  ...overrides,
});

export const tool = (overrides: Partial<Tool> = {}): Tool => ({
  id: "t-1",
  toolCode: "json-formatter",
  categorySlug: "developer",
  name: "JSON formatter",
  description: "Pretty-print JSON",
  longDescription: "",
  url: "https://tools.test/json",
  icon: "",
  color: "",
  features: [],
  useCases: [],
  keywords: [],
  pricing: null,
  isMVP: false,
  order: 1,
  ...overrides,
});

export const issue = (overrides: Partial<NewsletterIssue> = {}): NewsletterIssue => ({
  id: "i-1",
  slug: "october",
  title: "October issue",
  summary: "What shipped",
  coverImage: "",
  publishedAt: "2026-10-01T09:00:00.000Z",
  content: "<p>News</p>",
  contentCss: "",
  ...overrides,
});

export const policy = (overrides: Partial<PublicPolicy> = {}): PublicPolicy => ({
  title: "Privacy Policy",
  slug: "privacy",
  summary: "How we handle data",
  body: "<p>Body</p>",
  version: 1,
  effectiveDate: "2026-01-01",
  updatedAt: "2026-01-01",
  ...overrides,
});
