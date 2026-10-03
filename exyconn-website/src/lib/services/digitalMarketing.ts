import type { InnerAction } from "../../components/inner/types";

/** Content of /services/digital-marketing — the copy the page already carried. */
export const marketingMeta = {
  title: "Digital Marketing Services | Exyconn",
  description:
    "Exyconn Digital Marketing — SEO, PPC, social, content, email, branding, influencer, CRO, and analytics services that grow brand, traffic, and revenue.",
  keywords:
    "digital marketing, SEO, PPC, performance marketing, social media, content marketing, email marketing, branding, CRO, marketing analytics, Exyconn",
};

export const marketingHero: {
  title: string;
  lede: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Grow brand, traffic and revenue",
  lede: "Full-funnel digital marketing — SEO, paid media, social, content, email, branding, CRO and analytics — engineered for measurable business outcomes.",
  primary: { label: "Talk to a strategist", href: "/contact" },
  secondary: { label: "Get a quote", href: "/get-a-quote" },
};

export interface MarketingService {
  /** Anchor on the page; the services hub deep-links to it. */
  id: string;
  title: string;
  description: string;
  features: readonly string[];
}

export const marketingServices: readonly MarketingService[] = [
  {
    id: "seo",
    title: "SEO (search engine optimization)",
    description:
      "Rank higher on Google and capture qualified organic demand with technical SEO, on-page optimization, content strategy and authoritative link building.",
    features: [
      "Technical SEO audits & Core Web Vitals",
      "On-page optimization & schema markup",
      "Keyword research & content gap analysis",
      "Link building & digital PR",
      "Local SEO & Google Business Profile",
      "International & multilingual SEO",
    ],
  },
  {
    id: "ppc",
    title: "Performance marketing & PPC",
    description:
      "Full-funnel paid media across Google, Meta, LinkedIn, YouTube and programmatic — engineered for ROAS, not vanity metrics.",
    features: [
      "Google Ads (Search, Performance Max, Shopping)",
      "Meta Ads (Facebook & Instagram)",
      "LinkedIn Ads for B2B",
      "YouTube & video advertising",
      "Programmatic & display retargeting",
      "Bid management & budget pacing",
    ],
  },
  {
    id: "social",
    title: "Social media marketing",
    description:
      "Build a brand people remember. Strategy, content production, community management and paid social on every platform that matters.",
    features: [
      "Channel strategy & content calendars",
      "Reels, shorts & short-form video",
      "Community management & engagement",
      "Paid social campaigns",
      "Social listening & reputation",
      "Platform analytics & growth reports",
    ],
  },
  {
    id: "content",
    title: "Content marketing & copywriting",
    description:
      "SEO-led blogs, conversion-focused landing pages, whitepapers, case studies and video scripts that move people from awareness to revenue.",
    features: [
      "Long-form blog & article writing",
      "Landing page & sales copy",
      "Whitepapers, eBooks & case studies",
      "Video scripts & YouTube content",
      "Editorial calendars & topic clusters",
      "AI-assisted content workflows",
    ],
  },
  {
    id: "email",
    title: "Email & marketing automation",
    description:
      "Lifecycle email, drip sequences, CRM workflows and lead nurturing using HubSpot, Mailchimp, Klaviyo, ActiveCampaign and custom stacks.",
    features: [
      "Welcome & onboarding flows",
      "Lead nurture & drip campaigns",
      "Cart abandonment & re-engagement",
      "Newsletter strategy & design",
      "CRM workflows (HubSpot, Salesforce)",
      "Deliverability & inbox placement",
    ],
  },
  {
    id: "branding",
    title: "Branding & creative design",
    description:
      "Logo, brand identity, ad creatives and motion graphics that stop the scroll and stay in memory.",
    features: [
      "Logo & visual identity systems",
      "Brand guidelines & messaging",
      "Static & video ad creatives",
      "Motion graphics & animation",
      "Pitch decks & sales collateral",
      "Packaging & print design",
    ],
  },
  {
    id: "influencer",
    title: "Influencer & affiliate marketing",
    description:
      "Scale word-of-mouth with vetted creator partnerships, UGC campaigns and performance-based affiliate programs.",
    features: [
      "Influencer discovery & vetting",
      "Campaign briefs & contract management",
      "UGC content production",
      "Affiliate program setup & tracking",
      "Creator relationship management",
      "Performance & ROI reporting",
    ],
  },
  {
    id: "cro",
    title: "Conversion rate optimization (CRO)",
    description:
      "Funnel audits, A/B testing, heatmaps and UX improvements that turn existing traffic into more revenue.",
    features: [
      "Conversion funnel audits",
      "A/B & multivariate testing",
      "Heatmaps & session recordings",
      "Landing page optimization",
      "Checkout & form optimization",
      "Personalization & segmentation",
    ],
  },
  {
    id: "analytics",
    title: "Marketing analytics & reporting",
    description:
      "GA4, GTM, server-side tracking, attribution modeling and executive dashboards that turn data into clear decisions.",
    features: [
      "GA4 & GTM implementation",
      "Server-side tracking & consent mode",
      "Attribution modeling",
      "Looker Studio & Power BI dashboards",
      "Marketing mix & incrementality",
      "Monthly performance reviews",
    ],
  },
];

export const marketingStats = [
  { value: String(marketingServices.length), label: "Marketing capabilities" },
  { value: "4×", label: "Average ROAS lift" },
  { value: "60%", label: "Organic growth in 6 months" },
  { value: "24/7", label: "Campaign monitoring" },
];

export const marketingProcess = [
  {
    title: "Audit & strategy",
    text: "Deep audit of your funnel, competitors and market. A roadmap with clear KPIs.",
  },
  {
    title: "Build & launch",
    text: "Campaigns, creatives, content and tracking implemented in weeks, not months.",
  },
  {
    title: "Optimize",
    text: "Continuous testing, bid tuning and creative refresh for compounding gains.",
  },
  {
    title: "Report & scale",
    text: "Transparent dashboards, monthly reviews and a plan to scale what works.",
  },
];

export const marketingChapters = {
  services: {
    label: "Capabilities",
    title: "Every marketing service under one roof",
    lede: "One integrated team across strategy, creative, paid, organic and analytics — so your funnel works end to end.",
  },
  process: {
    label: "How we work",
    title: "A process that compounds month over month",
  },
};

export const marketingCta: {
  title: string;
  text: string;
  primary: InnerAction;
  secondary: InnerAction;
} = {
  title: "Ready to grow with Exyconn?",
  text: "Tell us your goals — we'll come back with a custom marketing plan and a clear roadmap to hit them.",
  primary: { label: "Book a free consultation", href: "/contact" },
  secondary: { label: "Get a quote", href: "/get-a-quote" },
};
