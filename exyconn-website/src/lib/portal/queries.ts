import { portalRequest } from './client';
import type {
  BlogPost,
  CaseStudy,
  Gig,
  Job,
  JobCompany,
  JobWithCompany,
  NavLink,
  Tool,
  ToolCategory,
  ToolCategoryWithTools,
} from './types';

const BLOG_FIELDS = `
  id slug title summary content readTime tags coverImage featured publishedAt
  author { name role initials }
`;

const CASE_STUDY_FIELDS = `
  id slug title excerpt content coverImage category author tags pdfUrl featured publishedAt
`;

const COMPANY_FIELDS = `
  id companyCode slug name logo tagline description culture website founded employees
  industry headquarters brandColor secondaryColor
  benefits { icon title description }
  socialLinks { linkedin twitter facebook instagram }
`;

const JOB_FIELDS = `
  id jobCode companySlug title category skillSet shortJobDescription jobDescription
  jobResponsibilities requirements niceToHave benefits location jobType experienceLevel
  workMode salaryRange jobPostDate applicationDeadline isFeatured
`;

const GIG_FIELDS = `
  id gigCode title category shortDescription fullDescription deliverables requirements
  tags budget duration status applicationType applicationContact postedDate deadline isUrgent
`;

const TOOL_CATEGORY_FIELDS = `id slug category description icon color`;

const TOOL_FIELDS = `
  id toolCode categorySlug name description longDescription url icon color
  features useCases keywords isMVP
  pricing { price currency features alterationNote }
`;

const NAV_LINK_FIELDS = `id label href description category keywords`;

// ── Blog ────────────────────────────────────────────────────────────────────

export async function getBlogPosts(): Promise<BlogPost[]> {
  const data = await portalRequest<{ publicBlogPosts: BlogPost[] }>(
    `query { publicBlogPosts { ${BLOG_FIELDS} } }`,
  );
  return data.publicBlogPosts;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const data = await portalRequest<{ publicBlogPost: BlogPost | null }>(
    `query GetBlogPost($slug: String!) { publicBlogPost(slug: $slug) { ${BLOG_FIELDS} } }`,
    { slug },
  );
  return data.publicBlogPost;
}

// ── Case studies ────────────────────────────────────────────────────────────

export async function getCaseStudies(): Promise<CaseStudy[]> {
  const data = await portalRequest<{ publicCaseStudies: CaseStudy[] }>(
    `query { publicCaseStudies { ${CASE_STUDY_FIELDS} } }`,
  );
  return data.publicCaseStudies;
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const data = await portalRequest<{ publicCaseStudy: CaseStudy | null }>(
    `query GetCaseStudy($slug: String!) { publicCaseStudy(slug: $slug) { ${CASE_STUDY_FIELDS} } }`,
    { slug },
  );
  return data.publicCaseStudy;
}

// ── Careers ─────────────────────────────────────────────────────────────────

export async function getJobCompanies(): Promise<JobCompany[]> {
  const data = await portalRequest<{ publicJobCompanies: JobCompany[] }>(
    `query { publicJobCompanies { ${COMPANY_FIELDS} } }`,
  );
  return data.publicJobCompanies;
}

export async function getJobCompany(slug: string): Promise<JobCompany | null> {
  const data = await portalRequest<{ publicJobCompany: JobCompany | null }>(
    `query GetJobCompany($slug: String!) { publicJobCompany(slug: $slug) { ${COMPANY_FIELDS} } }`,
    { slug },
  );
  return data.publicJobCompany;
}

export async function getJobs(companySlug?: string): Promise<Job[]> {
  const data = await portalRequest<{ publicJobs: Job[] }>(
    `query GetJobs($companySlug: String) { publicJobs(companySlug: $companySlug) { ${JOB_FIELDS} } }`,
    { companySlug },
  );
  return data.publicJobs;
}

export async function getJob(jobCode: string): Promise<Job | null> {
  const data = await portalRequest<{ publicJob: Job | null }>(
    `query GetJob($jobCode: String!) { publicJob(jobCode: $jobCode) { ${JOB_FIELDS} } }`,
    { jobCode },
  );
  return data.publicJob;
}

/** Every active job paired with its company, newest first — powers the careers index. */
export async function getJobsWithCompanies(): Promise<JobWithCompany[]> {
  const [jobs, companies] = await Promise.all([getJobs(), getJobCompanies()]);
  const bySlug = new Map(companies.map((company) => [company.slug, company]));

  return jobs
    .flatMap((job) => {
      const company = bySlug.get(job.companySlug);
      return company ? [{ job, company }] : [];
    })
    .sort((a, b) => Date.parse(b.job.jobPostDate) - Date.parse(a.job.jobPostDate));
}

// ── Gigs ────────────────────────────────────────────────────────────────────

export async function getGigs(): Promise<Gig[]> {
  const data = await portalRequest<{ publicGigs: Gig[] }>(`query { publicGigs { ${GIG_FIELDS} } }`);
  return data.publicGigs;
}

/** Only gigs that are still open for applications. */
export async function getOpenGigs(): Promise<Gig[]> {
  const gigs = await getGigs();
  return gigs.filter((gig) => gig.status === 'open');
}

export async function getGig(gigCode: string): Promise<Gig | null> {
  const data = await portalRequest<{ publicGig: Gig | null }>(
    `query GetGig($gigCode: String!) { publicGig(gigCode: $gigCode) { ${GIG_FIELDS} } }`,
    { gigCode },
  );
  return data.publicGig;
}

// ── Tools ───────────────────────────────────────────────────────────────────

export async function getToolCategories(): Promise<ToolCategory[]> {
  const data = await portalRequest<{ publicToolCategories: ToolCategory[] }>(
    `query { publicToolCategories { ${TOOL_CATEGORY_FIELDS} } }`,
  );
  return data.publicToolCategories;
}

export async function getTools(categorySlug?: string): Promise<Tool[]> {
  const data = await portalRequest<{ publicTools: Tool[] }>(
    `query GetTools($categorySlug: String) { publicTools(categorySlug: $categorySlug) { ${TOOL_FIELDS} } }`,
    { categorySlug },
  );
  return data.publicTools;
}

export async function getTool(toolCode: string): Promise<Tool | null> {
  const data = await portalRequest<{ publicTool: Tool | null }>(
    `query GetTool($toolCode: String!) { publicTool(toolCode: $toolCode) { ${TOOL_FIELDS} } }`,
    { toolCode },
  );
  return data.publicTool;
}

/**
 * Categories with their tools nested, mirroring the shape the tools pages used to get
 * from the hardcoded `toolsData` array. Grouped here rather than on the server because
 * the portal deliberately exposes no type-level field resolvers.
 */
export async function getToolCategoriesWithTools(): Promise<ToolCategoryWithTools[]> {
  const [categories, tools] = await Promise.all([getToolCategories(), getTools()]);

  return categories.map((category) => ({
    ...category,
    items: tools.filter((tool) => tool.categorySlug === category.slug),
  }));
}

// ── Navigation ──────────────────────────────────────────────────────────────

export async function getNavLinks(): Promise<NavLink[]> {
  const data = await portalRequest<{ publicNavLinks: NavLink[] }>(
    `query { publicNavLinks { ${NAV_LINK_FIELDS} } }`,
  );
  return data.publicNavLinks;
}
