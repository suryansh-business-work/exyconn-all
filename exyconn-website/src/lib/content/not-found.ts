/** Copy and destinations for the 404 page — every link is a route this site serves. */
export const NOT_FOUND_COPY = {
  metaTitle: "404 Not Found | Exyconn",
  metaDescription:
    "Sorry, the page you are looking for does not exist or has been moved. Explore Exyconn's AI automation, SaaS, and digital solutions.",
  metaKeywords: "404, not found, page missing, Exyconn, error",
  label: "Error 404",
  title: "This page is off the map",
  lede: "The address may have changed, or the page was retired. These routes will get you back on course.",
  primary: { label: "Go to the home page", href: "/" },
  secondary: { label: "Open the sitemap", href: "/sitemap" },
  chapterLabel: "Popular routes",
  chapterTitle: "Where people usually head",
  more: "Open",
  ctaLabel: "Still lost?",
  ctaTitle: "Tell us what you were looking for",
  ctaText: "We will point you to the right page — or build it.",
  ctaPrimary: { label: "Contact us", href: "/contact" },
} as const;

export const NOT_FOUND_LINKS = [
  { href: "/ai", title: "AI solutions", text: "Agents, workflows, models and MCP servers." },
  {
    href: "/services",
    title: "Services",
    text: "Custom software, mobile, SaaS and modernisation.",
  },
  {
    href: "/case-studies",
    title: "Case studies",
    text: "What changed for the businesses we work with.",
  },
  { href: "/blog", title: "Blog", text: "Guides and field notes from the team." },
  { href: "/our-tools", title: "Tools", text: "Free tools we build and maintain." },
  { href: "/career", title: "Careers", text: "Open roles and freelance gigs." },
] as const;
