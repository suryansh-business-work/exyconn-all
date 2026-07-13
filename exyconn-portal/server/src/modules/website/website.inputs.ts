/** GraphQL input shapes for the website CMS entities, used to type the CRUD services. */

export interface BlogAuthorInput {
  name: string;
  role?: string;
  initials?: string;
}

export interface BlogPostInput {
  slug: string;
  title: string;
  summary?: string;
  content?: string;
  author: BlogAuthorInput;
  readTime?: string;
  tags?: string[];
  coverImage?: string;
  featured?: boolean;
  isActive?: boolean;
  publishedAt?: Date;
}

export interface CaseStudyInput {
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category?: string;
  author?: string;
  tags?: string[];
  pdfUrl?: string;
  featured?: boolean;
  isActive?: boolean;
  publishedAt?: Date;
}

export interface CompanyBenefitInput {
  icon: string;
  title: string;
  description?: string;
}

export interface CompanySocialLinksInput {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
}

export interface JobCompanyInput {
  companyCode: string;
  slug: string;
  name: string;
  logo?: string;
  tagline?: string;
  description?: string;
  culture?: string;
  website?: string;
  founded?: string;
  employees?: string;
  industry?: string;
  headquarters?: string;
  benefits?: CompanyBenefitInput[];
  socialLinks?: CompanySocialLinksInput;
  brandColor?: string;
  secondaryColor?: string;
  isActive?: boolean;
  order?: number;
}

export interface JobInput {
  jobCode: string;
  companySlug: string;
  title: string;
  category: string;
  skillSet?: string[];
  shortJobDescription?: string;
  jobDescription?: string;
  jobResponsibilities?: string;
  requirements?: string[];
  niceToHave?: string[];
  benefits?: string[];
  location?: string;
  jobType: string;
  experienceLevel: string;
  workMode: string;
  salaryRange?: string;
  jobPostDate?: Date;
  applicationDeadline?: Date;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface GigInput {
  gigCode: string;
  title: string;
  category: string;
  shortDescription?: string;
  fullDescription?: string;
  deliverables?: string[];
  requirements?: string[];
  tags?: string[];
  budget?: string;
  duration: string;
  status: string;
  applicationType: string;
  applicationContact: string;
  postedDate?: Date;
  deadline?: Date;
  isUrgent?: boolean;
}

export interface ToolCategoryInput {
  slug: string;
  category: string;
  description?: string;
  icon?: string;
  color?: string;
  seo?: Record<string, unknown>;
  isActive?: boolean;
  order?: number;
}

export interface ToolPricingInput {
  price: number;
  currency: string;
  features?: string[];
  alterationNote?: string;
}

export interface ToolInput {
  toolCode: string;
  categorySlug: string;
  name: string;
  description?: string;
  longDescription?: string;
  url?: string;
  icon?: string;
  color?: string;
  features?: string[];
  useCases?: string[];
  keywords?: string[];
  pricing?: ToolPricingInput;
  seo?: Record<string, unknown>;
  isActive?: boolean;
  isMVP?: boolean;
  order?: number;
}

export interface NavLinkInput {
  label: string;
  href: string;
  description?: string;
  category: string;
  keywords?: string;
  isActive?: boolean;
  order?: number;
}
