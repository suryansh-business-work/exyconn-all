import type { ListJobCompaniesQuery } from '@exyconn/shell/graphql/generated';

export type JobCompanyRow = ListJobCompaniesQuery['listJobCompanies'][number];

/** One `{ icon, title, description }` entry of a company's `benefits` field array. */
export interface CompanyBenefitValue {
  icon: string;
  title: string;
  description: string;
}

/** Nested `socialLinks` object — RHF names are "socialLinks.<network>". */
export interface CompanySocialLinksValue {
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
}

export interface JobCompanyFormValues {
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
  benefits: CompanyBenefitValue[];
  socialLinks: CompanySocialLinksValue;
  brandColor: string;
  secondaryColor: string;
  isActive: boolean;
  order: number;
}
