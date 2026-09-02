/** Content types served by the portal. These mirror the portal's GraphQL schema. */

export interface BlogAuthor {
  name: string;
  role: string;
  initials: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  author: BlogAuthor;
  readTime: string;
  tags: string[];
  coverImage: string;
  featured: boolean;
  publishedAt: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  tags: string[];
  pdfUrl: string;
  featured: boolean;
  publishedAt: string;
}

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
