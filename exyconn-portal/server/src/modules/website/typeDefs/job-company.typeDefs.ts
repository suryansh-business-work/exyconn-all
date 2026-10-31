import gql from 'graphql-tag';

export const jobCompanyTypeDefs = gql`
  type CompanyBenefit {
    icon: String!
    title: String!
    description: String!
  }

  input CompanyBenefitInput {
    icon: String!
    title: String!
    description: String
  }

  type CompanySocialLinks {
    linkedin: String!
    twitter: String!
    facebook: String!
    instagram: String!
  }

  input CompanySocialLinksInput {
    linkedin: String
    twitter: String
    facebook: String
    instagram: String
  }

  type JobCompany {
    id: ID!
    "The website it belongs to (Website > Websites)."
    siteId: String!
    companyCode: String!
    slug: String!
    name: String!
    logo: String!
    tagline: String!
    description: String!
    culture: String!
    website: String!
    founded: String!
    employees: String!
    industry: String!
    headquarters: String!
    benefits: [CompanyBenefit!]!
    socialLinks: CompanySocialLinks!
    brandColor: String!
    secondaryColor: String!
    isActive: Boolean!
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    "Its own search and share meta; null on items saved before it existed."
    seo: ItemSeo
  }

  input JobCompanyInput {
    siteId: String
    companyCode: String!
    slug: String!
    name: String!
    logo: String
    tagline: String
    description: String
    culture: String
    website: String
    founded: String
    employees: String
    industry: String
    headquarters: String
    benefits: [CompanyBenefitInput!]
    socialLinks: CompanySocialLinksInput
    brandColor: String
    secondaryColor: String
    isActive: Boolean
    order: Int
    seo: ItemSeoInput
  }

  type JobCompanyPage {
    rows: [JobCompany!]!
    totalCount: Int!
  }

  extend type Query {
    listJobCompanies: [JobCompany!]!
    listJobCompaniesPaged(input: TableQueryInput!): JobCompanyPage!
    listJobCompaniesStats: TableStats!
    getJobCompany(id: ID!): JobCompany!
    "Public: lists a site's active hiring companies in their display order."
    publicJobCompanies(
      "The site's key; the default site when left out."
      site: String
    ): [JobCompany!]!
    "Public: reads one active hiring company by its address; null when there is none."
    publicJobCompany(
      "The company's URL slug."
      slug: String!
      "The site's key; the default site when left out."
      site: String
    ): JobCompany
  }

  extend type Mutation {
    createJobCompany(input: JobCompanyInput!): JobCompany!
    updateJobCompany(id: ID!, input: JobCompanyInput!): JobCompany!
    deleteJobCompany(id: ID!): Boolean!
  }
`;
