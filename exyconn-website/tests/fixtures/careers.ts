/**
 * Careers FIXTURES — local design work and tests only, never shipped.
 *
 * The live portal has no jobs, gigs or companies yet, so the populated careers pages are built
 * against these rows: the unit tests import them, and `astro dev` answers portal reads from
 * `answerPortalQuery` when started with PORTAL_FIXTURES=<absolute path of this file> (see
 * src/lib/portal/client.ts). Anything that is not a careers read is passed on to the shared
 * content fixtures (./portal.ts). Every row is invented sample content.
 */
import type { Gig, Job, JobCompany } from "../../src/lib/portal/types";
import { answerPortalQuery as answerContentQuery } from "./portal";

const logo = (letter: string, colour: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="20" fill="${colour}"/><text x="48" y="62" font-family="Arial" font-size="44" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text></svg>`
  )}`;

const company = (
  slug: string,
  name: string,
  industry: string,
  colour: string,
  extra: Partial<JobCompany> = {}
): JobCompany => ({
  id: `company-${slug}`,
  companyCode: slug,
  slug,
  name,
  logo: logo(name[0], colour),
  tagline: `${name} builds software for teams that move fast.`,
  description:
    "<p>A product company in the group, shipping to customers every week.</p><p>Small teams own whole problems end to end, from the first sketch to production.</p>",
  culture:
    "<p>Written first, async by default, and a weekly demo where everyone shows real work.</p>",
  website: `https://${slug}.example.com`,
  founded: "2022",
  employees: "25-50",
  industry,
  headquarters: "Pune, India",
  benefits: [
    {
      icon: "fa-house",
      title: "Remote first",
      description: "Work from wherever you do your best work.",
    },
    {
      icon: "fa-book",
      title: "Learning budget",
      description: "Courses, books and conferences, paid for.",
    },
    { icon: "fa-heart", title: "Health cover", description: "Insurance for you and your family." },
  ],
  socialLinks: {
    linkedin: `https://linkedin.com/company/${slug}`,
    twitter: "",
    facebook: "",
    instagram: "",
  },
  brandColor: colour,
  secondaryColor: colour,
  ...extra,
});

export const FIXTURE_COMPANIES: JobCompany[] = [
  company("exyconn", "Exyconn", "AI and software services", "#4f46e5"),
  company("spentiva", "Spentiva", "FinTech", "#0d9488"),
  company("sibera", "Sibera", "Community apps", "#db2777", {
    culture: "<p></p>",
    socialLinks: { linkedin: "", twitter: "", facebook: "", instagram: "" },
  }),
  company("group", "Exyconn Group", "Group", "#111827"),
];

const job = (
  index: number,
  companySlug: string,
  title: string,
  category: string,
  extra: Partial<Job> = {}
): Job => ({
  id: `job-${index}`,
  jobCode: `JOB-${String(index).padStart(3, "0")}`,
  companySlug,
  title,
  category,
  skillSet: ["TypeScript", "React", "Node.js", "GraphQL", "MongoDB", "AWS"].slice(
    0,
    3 + (index % 4)
  ),
  shortJobDescription: "Own a product area end to end with a small, senior team.",
  jobDescription:
    "<p>You will design, build and run features used by thousands of people every day.</p><h3>What the work looks like</h3><p>Short cycles, written specs and a weekly demo.</p>",
  jobResponsibilities:
    "<ul><li>Ship features from spec to production.</li><li>Review code and mentor teammates.</li><li>Keep the system observable and fast.</li></ul>",
  requirements: ["3+ years building web products", "Comfortable owning a feature end to end"],
  niceToHave: index % 2 ? ["Experience with AI products"] : [],
  benefits: ["Remote-first", "Learning budget", "Health insurance"],
  location: index % 3 ? "Pune, Maharashtra, India" : "Remote",
  jobType: index % 5 ? "Full Time" : "Contract",
  experienceLevel: index % 2 ? "Senior" : "Mid Level",
  workMode: index % 3 ? "Hybrid" : "Remote",
  salaryRange: index % 2 ? "₹18–28 LPA" : "",
  jobPostDate: `2026-09-${String(28 - index).padStart(2, "0")}T09:00:00.000Z`,
  applicationDeadline: index === 1 ? "2026-10-31T00:00:00.000Z" : null,
  isFeatured: index === 1,
  ...extra,
});

export const FIXTURE_JOBS: Job[] = [
  job(1, "exyconn", "Senior full-stack engineer", "Engineering"),
  job(2, "exyconn", "AI engineer, agents", "AI/ML"),
  job(3, "spentiva", "Product designer", "Design"),
  job(4, "spentiva", "Backend engineer, payments", "Engineering"),
  job(5, "sibera", "Growth marketer", "Marketing"),
  job(6, "group", "Head of people operations", "HR"),
  job(7, "exyconn", "DevOps engineer", "DevOps"),
];

const gig = (index: number, category: string, title: string, extra: Partial<Gig> = {}): Gig => ({
  id: `gig-${index}`,
  gigCode: `GIG-${String(index).padStart(3, "0")}`,
  title,
  category,
  shortDescription: "A scoped project with a clear brief, assets and a single point of contact.",
  fullDescription:
    "<p>We need help on a well-defined piece of work. The brief, assets and access are ready.</p>",
  deliverables: ["Working deliverable", "Short hand-over note"],
  requirements: ["A portfolio with similar work", "Available to start this month"],
  tags: ["Figma", "React", "Copywriting", "SEO", "Python", "Notion"].slice(
    index % 3,
    (index % 3) + 3 + (index % 3)
  ),
  budget: index % 3 ? `₹${20 + index * 5},000` : "",
  duration: index % 2 ? "1-2 weeks" : "< 1 week",
  status: "open",
  applicationType: "email",
  applicationContact: "gigs@example.com",
  postedDate: `2026-09-${String(29 - index).padStart(2, "0")}T09:00:00.000Z`,
  deadline: index % 2 ? `2026-10-${String(10 + index).padStart(2, "0")}T00:00:00.000Z` : null,
  isUrgent: index === 2,
  ...extra,
});

export const FIXTURE_GIGS: Gig[] = [
  gig(1, "Development", "Landing page in Astro"),
  gig(2, "Design", "Onboarding screens for a mobile app"),
  gig(3, "Writing", "Five blog posts on AI agents"),
  gig(4, "AI/ML", "Evaluate a support chatbot", {
    applicationType: "whatsapp",
    applicationContact: "+91 90000 00001",
  }),
  gig(5, "Other", "Organise a community meetup"),
  gig(6, "Data", "Clean and chart a sales dataset"),
  gig(7, "Video", "Edit a two-minute product demo", { status: "completed" }),
];

const ROOTS: Record<string, (variables: Record<string, unknown>) => unknown> = {
  publicJobCompanies: () => FIXTURE_COMPANIES,
  publicJobCompany: ({ slug }) => FIXTURE_COMPANIES.find((one) => one.slug === slug) ?? null,
  publicJobs: ({ companySlug }) =>
    FIXTURE_JOBS.filter((one) => !companySlug || one.companySlug === companySlug),
  publicJob: ({ jobCode }) => FIXTURE_JOBS.find((one) => one.jobCode === jobCode) ?? null,
  publicGigs: () => FIXTURE_GIGS,
  publicGig: ({ gigCode }) => FIXTURE_GIGS.find((one) => one.gigCode === gigCode) ?? null,
  websiteCaptcha: () => ({ token: "fixture-captcha", question: "2 + 3" }),
  createWebsiteSubmission: () => ({ id: "fixture-submission" }),
};

/** Answers a careers read like the portal would; everything else goes to the content fixtures. */
export function answerPortalQuery(query: string, variables: Record<string, unknown>): unknown {
  const root = /\{\s*(\w+)/.exec(query)?.[1] ?? "";
  const answer = ROOTS[root];
  return answer ? { [root]: answer(variables) } : answerContentQuery(query, variables);
}
