import { portalRequest } from './client';
import type {
  Branding,
  Gig,
  Job,
  JobCompany,
  JobWithCompany,
  NavLink,
  PublicPolicy,
} from './types';

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

const NAV_LINK_FIELDS = `id label href description category keywords`;

const BRANDING_FIELDS = `
  businessName legalName slogan description
  logoUrl logoDarkUrl faviconUrl appIconUrl emailLogoUrl ogImageUrl
  primaryColor secondaryColor accentColor backgroundColor textColor
  supportEmail contactPhone websiteUrl address
  linkedinUrl twitterUrl facebookUrl instagramUrl youtubeUrl githubUrl
  copyrightText
`;

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

// ── Navigation ──────────────────────────────────────────────────────────────

export async function getNavLinks(): Promise<NavLink[]> {
  const data = await portalRequest<{ publicNavLinks: NavLink[] }>(
    `query { publicNavLinks { ${NAV_LINK_FIELDS} } }`,
  );
  return data.publicNavLinks;
}

// ── Branding ────────────────────────────────────────────────────────────────

export async function getBranding(): Promise<Branding> {
  const data = await portalRequest<{ publicBranding: Branding }>(
    `query { publicBranding { ${BRANDING_FIELDS} } }`,
  );
  return data.publicBranding;
}

/**
 * The branding the site shipped with before it was portal-driven. Used two ways:
 *
 *  1. whole-object, when the portal is unreachable (see `getBrandingSafe`);
 *  2. per-field, when the portal answers but the field is still an empty string — the
 *     branding row starts out with blank image URLs and stays that way until an admin
 *     uploads logos, so `branding.logoUrl || BRANDING_FALLBACK.logoUrl` is the standard
 *     read. This keeps the site pixel-identical to its pre-portal self until branding is
 *     actually filled in.
 *
 * Fields the site does not render are deliberately empty: there is no old hardcoded value
 * to preserve. `copyrightText` is empty because the footer derives it from `legalName` plus
 * the current year, and Facebook/Instagram/YouTube are empty because those icons never
 * existed — an empty URL simply means "don't render this icon".
 */
export const BRANDING_FALLBACK: Branding = {
  businessName: 'Exyconn',
  legalName: 'Exyconn Business Solutions',
  slogan: 'AI-Powered Business Solutions',
  description:
    "Transform your business with Exyconn's AI solutions and comprehensive technology infrastructure.",

  logoUrl: 'https://ik.imagekit.io/esdata1/exyconn/logo/exyconn.svg',
  logoDarkUrl: '',
  faviconUrl: '/favicon.svg',
  appIconUrl: '',
  emailLogoUrl: '',
  ogImageUrl: '/og-image.svg',

  primaryColor: '#0071e3',
  secondaryColor: '#9333ea',
  accentColor: '#06b6d4',
  backgroundColor: '#ffffff',
  textColor: '#111827',

  supportEmail: '',
  contactPhone: '',
  websiteUrl: 'https://exyconn.com',
  address: '',

  linkedinUrl: 'https://linkedin.com/company/exyconn',
  twitterUrl: 'https://twitter.com/exyconn',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  githubUrl: 'https://github.com/exyconn',

  copyrightText: '',
};

/**
 * Branding, but never throwing.
 *
 * The portal client deliberately has NO fallback (see client.ts): for blog, careers and the
 * rest, serving stale bundled content would silently mask an editor's change, so a failed
 * fetch must surface. Branding is the one exception, because it is site *chrome* — the
 * header logo, favicon, theme colour and footer render on EVERY page. Letting a brief portal
 * hiccup 500 the entire website is far worse than showing last-known-good branding for a few
 * seconds, so this single query falls back to `BRANDING_FALLBACK` and logs the failure.
 *
 * Pages and layout components should always use this, never `getBranding` directly.
 */
export async function getBrandingSafe(): Promise<Branding> {
  try {
    return await getBranding();
  } catch (error) {
    console.error('Portal branding fetch failed — using bundled fallback branding.', error);
    return BRANDING_FALLBACK;
  }
}

const POLICY_FIELDS = `
  title slug summary body version effectiveDate updatedAt
`;

/** Every policy Legal has published for the public. */
export async function getPublicPolicies(): Promise<PublicPolicy[]> {
  const data = await portalRequest<{ publicPolicies: PublicPolicy[] }>(
    `query { publicPolicies { ${POLICY_FIELDS} } }`,
  );
  return data.publicPolicies;
}

/** One public policy by slug, or null when Legal has not published one at that address. */
export async function getPublicPolicy(slug: string): Promise<PublicPolicy | null> {
  const data = await portalRequest<{ publicPolicy: PublicPolicy | null }>(
    `query PublicPolicy($slug: String!) { publicPolicy(slug: $slug) { ${POLICY_FIELDS} } }`,
    { slug },
  );
  return data.publicPolicy;
}
