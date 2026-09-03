/** Content types served by the portal. These mirror the portal's GraphQL schema. */

export interface CompanyBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface CompanySocialLinks {
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
}

export interface JobCompany {
  id: string;
  companyCode: string;
  slug: string;
  name: string;
  logo: string;
  tagline: string;
  description: string;
  culture: string;
  website: string;
  founded: string;
  employees: string;
  industry: string;
  headquarters: string;
  benefits: CompanyBenefit[];
  socialLinks: CompanySocialLinks;
  brandColor: string;
  secondaryColor: string;
}

export interface Job {
  id: string;
  jobCode: string;
  companySlug: string;
  title: string;
  category: string;
  skillSet: string[];
  shortJobDescription: string;
  jobDescription: string;
  jobResponsibilities: string;
  requirements: string[];
  niceToHave: string[];
  benefits: string[];
  location: string;
  jobType: string;
  experienceLevel: string;
  workMode: string;
  salaryRange: string;
  jobPostDate: string;
  applicationDeadline: string | null;
  isFeatured: boolean;
}

export interface Gig {
  id: string;
  gigCode: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  deliverables: string[];
  requirements: string[];
  tags: string[];
  budget: string;
  duration: string;
  status: string;
  applicationType: string;
  applicationContact: string;
  postedDate: string;
  deadline: string | null;
  isUrgent: boolean;
}

export interface NavLink {
  id: string;
  label: string;
  href: string;
  description: string;
  category: string;
  keywords: string;
}

/**
 * Site-wide branding (name, logos, colours, socials) served by `publicBranding`.
 * Every field is a non-null String in the schema, but may be an empty string until an
 * admin fills it in — callers must treat "" as "unset" (see BRANDING_FALLBACK).
 */
export interface Branding {
  businessName: string;
  legalName: string;
  slogan: string;
  description: string;

  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  appIconUrl: string;
  emailLogoUrl: string;
  ogImageUrl: string;

  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;

  supportEmail: string;
  contactPhone: string;
  websiteUrl: string;
  address: string;

  linkedinUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  githubUrl: string;

  copyrightText: string;
}

/** A job paired with the company that posted it. */
export interface JobWithCompany {
  job: Job;
  company: JobCompany;
}

/**
 * A published, public company policy, authored in the portal's Legal module.
 *
 * The site renders these rather than carrying its own copy: a privacy policy that lives in
 * two places is a privacy policy that will eventually say two different things, and only one
 * of them will have been reviewed.
 */
export interface PublicPolicy {
  title: string;
  slug: string;
  summary: string;
  body: string;
  version: number;
  effectiveDate: string;
  updatedAt: string;
}
